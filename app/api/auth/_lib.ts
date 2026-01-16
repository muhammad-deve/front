import { cookies } from "next/headers"
import crypto from "node:crypto"
import { getPocketBaseAuthorizationHeaderValue, pbBaseUrl } from "../pb/_auth"

const OTP_TTL_MS = 10 * 60 * 1000
const OTP_MAX_ATTEMPTS = 8

type OtpPurpose = "signin" | "signup"

type OtpEntry = {
  codeHash: string
  expiresAt: number
  attempts: number
}

type PBOtpRecord = {
  id: string
  email?: string
  purpose?: string
  code_hash?: string
  hash_code?: string
  expires_at?: number
  attempts?: number
}

type PBListResp<T> = {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  items: T[]
}

async function pbOtpFetch(path: string, init?: RequestInit) {
  const authorization = await getPocketBaseAuthorizationHeaderValue()
  return fetch(new URL(path, pbBaseUrl()).toString(), {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.headers || {}),
      Authorization: authorization,
    },
  })
}

function pbOtpCollectionPath(suffix: string) {
  const name = (process.env.PB_OTP_COLLECTION || "email_otps").trim() || "email_otps"
  return `/api/collections/${name}/records${suffix}`
}

function pbOtpHashFieldName(): "code_hash" | "hash_code" {
  const n = (process.env.PB_OTP_HASH_FIELD || "hash_code").trim()
  return n === "hash_code" ? "hash_code" : "code_hash"
}

function otpBodyWithHashField(base: Record<string, unknown>, field: "code_hash" | "hash_code", hash: string) {
  return { ...base, [field]: hash }
}

export function generateOtp5(): string {
  return String(Math.floor(10000 + Math.random() * 90000))
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex")
}

export function getOtpSecret(): string {
  const s = (process.env.OTP_SECRET || "").trim()
  if (!s) {
    throw new Error("Missing OTP_SECRET env var")
  }
  return s
}

export async function storeOtp(email: string, purpose: OtpPurpose, otp: string) {
  const now = Date.now()
  const entry: OtpEntry = {
    // Store OTP as-is (plain) to match the app's desired behavior.
    // (Hashing is optional; verification still supports hashed records for backward compatibility.)
    codeHash: otp,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
  }

  const base = {
    email: email.toLowerCase().trim(),
    purpose,
    expires_at: entry.expiresAt,
    attempts: entry.attempts,
  }

  const primaryField = pbOtpHashFieldName()
  const firstRes = await pbOtpFetch(pbOtpCollectionPath(""), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(otpBodyWithHashField(base, primaryField, entry.codeHash)),
  })

  if (firstRes.ok) return

  const firstText = await firstRes.text().catch(() => "")
  const fallbackField = primaryField === "code_hash" ? "hash_code" : "code_hash"

  // Auto-fallback when the PB collection uses a different field name.
  if (/unknown field/i.test(firstText) || /invalid/i.test(firstText) || /missing/i.test(firstText)) {
    const secondRes = await pbOtpFetch(pbOtpCollectionPath(""), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(otpBodyWithHashField(base, fallbackField, entry.codeHash)),
    })

    if (secondRes.ok) return
    const secondText = await secondRes.text().catch(() => "")
    throw new Error(`Failed to store OTP: ${secondRes.status} ${secondText}`)
  }

  throw new Error(`Failed to store OTP: ${firstRes.status} ${firstText}`)
}

export async function verifyOtp(email: string, purpose: OtpPurpose, otp: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim()
  if (!normalizedEmail) return false

  const safeEmail = normalizedEmail.replaceAll('"', "\\\"")
  const safePurpose = purpose.replaceAll('"', "\\\"")

  const listUrl = new URL(pbOtpCollectionPath(""), pbBaseUrl())
  listUrl.searchParams.set("page", "1")
  listUrl.searchParams.set("perPage", "1")
  listUrl.searchParams.set("sort", "-created")
  // Only filter by fields we know exist. We'll compare the code hash in-app.
  listUrl.searchParams.set("filter", `email="${safeEmail}" && purpose="${safePurpose}"`)

  const listRes = await pbOtpFetch(listUrl.pathname + listUrl.search)
  if (!listRes.ok) return false
  const list = (await listRes.json()) as PBListResp<PBOtpRecord>
  const rec = list.items?.[0] || null

  if (!rec?.id) return false

  const expiresAt = typeof rec.expires_at === "number" ? rec.expires_at : 0
  const attempts = typeof rec.attempts === "number" ? rec.attempts : 0
  const storedHash =
    typeof rec.code_hash === "string"
      ? rec.code_hash
      : typeof rec.hash_code === "string"
        ? rec.hash_code
        : ""

  const now = Date.now()
  if (!storedHash || now > expiresAt) {
    await pbOtpFetch(pbOtpCollectionPath(`/${rec.id}`), { method: "DELETE" }).catch(() => {})
    return false
  }

  const nextAttempts = attempts + 1
  if (nextAttempts > OTP_MAX_ATTEMPTS) {
    await pbOtpFetch(pbOtpCollectionPath(`/${rec.id}`), { method: "DELETE" }).catch(() => {})
    return false
  }

  // Prefer plain OTP compare. If a legacy hashed record exists, compare using OTP_SECRET.
  const looksLikeHexHash = /^[a-f0-9]{64}$/i.test(storedHash)

  let ok = false
  if (!looksLikeHexHash) {
    ok = storedHash === otp
  } else {
    const secret = String(process.env.OTP_SECRET || "").trim()
    if (secret) {
      const inputHash = sha256Hex(`${otp}:${secret}`)
      ok = crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(inputHash, "hex"))
    } else {
      ok = false
    }
  }

  if (ok) {
    await pbOtpFetch(pbOtpCollectionPath(`/${rec.id}`), { method: "DELETE" }).catch(() => {})
    return true
  }

  await pbOtpFetch(pbOtpCollectionPath(`/${rec.id}`), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ attempts: nextAttempts }),
  }).catch(() => {})

  return false
}

export type SessionUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  watchlist: string[]
  watchHistory: string[]
}

type SessionPayload = {
  v: 1
  user: SessionUser
  exp: number
}

function getSessionSecret(): string {
  const s = (process.env.SESSION_SECRET || "").trim()
  if (!s) {
    throw new Error("Missing SESSION_SECRET env var")
  }
  return s
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

export async function setSessionCookie(user: SessionUser) {
  const secret = getSessionSecret()
  const payload: SessionPayload = {
    v: 1,
    user,
    exp: Date.now() + 14 * 24 * 60 * 60 * 1000,
  }

  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"))
  const sig = hmacSha256(body, secret)
  const token = `${body}.${sig}`

  const cookieStore = await cookies()

  cookieStore.set({
    name: "sv_auth",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 14 * 24 * 60 * 60,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set({
    name: "sv_auth",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("sv_auth")?.value
  if (!token) return null

  const parts = token.split(".")
  if (parts.length !== 2) return null

  const [body, sig] = parts
  const secret = getSessionSecret()
  const expected = hmacSha256(body, secret)

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null

  let parsed: SessionPayload
  try {
    parsed = JSON.parse(b64urlDecode(body).toString("utf8")) as SessionPayload
  } catch {
    return null
  }

  if (!parsed?.user || parsed.v !== 1) return null
  if (typeof parsed.exp !== "number" || Date.now() > parsed.exp) return null
  return parsed.user
}
