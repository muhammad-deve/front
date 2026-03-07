import crypto from "node:crypto"
import { cookies } from "next/headers"

const RESET_COOKIE_NAME = "sv_reset"
const RESET_TTL_MS = 15 * 60 * 1000

type ResetPayload = {
  v: 1
  email: string
  exp: number
}

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
}

function b64urlDecode(str: string): Buffer {
  const padLen = (4 - (str.length % 4)) % 4
  const padded = str + "=".repeat(padLen)
  const b64 = padded.replaceAll("-", "+").replaceAll("_", "/")
  return Buffer.from(b64, "base64")
}

function hmacSha256(data: string, secret: string): string {
  return b64urlEncode(crypto.createHmac("sha256", secret).update(data).digest())
}

function getResetSecret(): string {
  const fromResetEnv = (process.env.PASSWORD_RESET_SECRET || "").trim()
  if (fromResetEnv) return fromResetEnv

  const fromSessionEnv = (process.env.SESSION_SECRET || "").trim()
  if (fromSessionEnv) return fromSessionEnv

  throw new Error("Missing PASSWORD_RESET_SECRET or SESSION_SECRET env var")
}

function createResetToken(email: string): string {
  const payload: ResetPayload = {
    v: 1,
    email,
    exp: Date.now() + RESET_TTL_MS,
  }

  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"))
  const sig = hmacSha256(body, getResetSecret())
  return `${body}.${sig}`
}

function readResetTokenEmail(token: string): string | null {
  const parts = token.split(".")
  if (parts.length !== 2) return null

  const [body, sig] = parts
  const expectedSig = hmacSha256(body, getResetSecret())

  const provided = Buffer.from(sig)
  const expected = Buffer.from(expectedSig)
  if (provided.length !== expected.length) return null
  if (!crypto.timingSafeEqual(provided, expected)) return null

  let parsed: ResetPayload
  try {
    parsed = JSON.parse(b64urlDecode(body).toString("utf8")) as ResetPayload
  } catch {
    return null
  }

  if (parsed?.v !== 1) return null
  if (typeof parsed?.email !== "string" || !parsed.email.trim()) return null
  if (typeof parsed?.exp !== "number" || Date.now() > parsed.exp) return null
  return parsed.email.trim().toLowerCase()
}

export async function setResetCookie(email: string) {
  const token = createResetToken(email.trim().toLowerCase())
  const cookieStore = await cookies()
  cookieStore.set({
    name: RESET_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RESET_TTL_MS / 1000,
  })
}

export async function clearResetCookie() {
  const cookieStore = await cookies()
  cookieStore.set({
    name: RESET_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export async function getResetEmailFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(RESET_COOKIE_NAME)?.value
  if (!token) return null
  return readResetTokenEmail(token)
}
