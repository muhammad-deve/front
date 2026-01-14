export const runtime = "nodejs"

export function pbBaseUrl(): string {
  return process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || "http://127.0.0.1:8090"
}

let cachedToken: string | null = null
let cachedAtMs = 0

function toAuthHeaderValue(token: string): string {
	const t = token.trim()
	if (!t) return ""
	return /^bearer\s+/i.test(t) ? t : `Bearer ${t}`
}

async function fetchSuperuserToken(): Promise<string> {
  const directToken = (process.env.PB_SUPERUSER_TOKEN || process.env.PB_ADMIN_TOKEN || "").trim()
  if (directToken) {
    return directToken
  }

  const email = (process.env.PB_SUPERUSER_EMAIL || "").trim()
  const password = (process.env.PB_SUPERUSER_PASSWORD || "").trim()

  if (!email || !password) {
    throw new Error(
      "Missing PocketBase superuser credentials. Set PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD in the frontend environment.",
    )
  }

  const url = new URL("/api/collections/_superusers/auth-with-password", pbBaseUrl())
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ identity: email, password }),
    cache: "no-store",
  })

  const bodyText = await res.text()
  if (!res.ok) {
    throw new Error(`PocketBase superuser auth failed: ${res.status} ${bodyText}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(bodyText)
  } catch {
    throw new Error(`PocketBase superuser auth returned non-JSON: ${bodyText}`)
  }

  const token = (parsed as { token?: unknown }).token
  if (typeof token !== "string" || token.trim() === "") {
    throw new Error("PocketBase superuser auth response missing token")
  }

  return token
}

export async function getPocketBaseSuperuserToken(): Promise<string> {
  // Simple in-memory cache for dev; refresh periodically.
  const ttlMs = 10 * 60 * 1000
  if (cachedToken && Date.now() - cachedAtMs < ttlMs) return cachedToken

  const token = await fetchSuperuserToken()
  cachedToken = token
  cachedAtMs = Date.now()
  return token
}

export async function getPocketBaseAuthorizationHeaderValue(): Promise<string> {
	const token = await getPocketBaseSuperuserToken()
	return toAuthHeaderValue(token)
}
