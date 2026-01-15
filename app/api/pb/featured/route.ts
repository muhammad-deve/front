import { pbBaseUrl } from "../_auth"
import { getPocketBaseAuthorizationHeaderValue } from "../_auth"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const target = new URL("/api/collections/featured/records", pbBaseUrl())

  const allowed = ["page", "perPage", "filter", "sort", "expand", "fields", "skipTotal"]
  for (const k of allowed) {
    const v = url.searchParams.get(k)
    if (v !== null) target.searchParams.set(k, v)
  }

  const authorization = await getPocketBaseAuthorizationHeaderValue()
  const res = await fetch(target.toString(), {
    cache: "no-store",
    headers: {
      Authorization: authorization,
    },
  })

  const body = await res.text()

  return new Response(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
    },
  })
}
