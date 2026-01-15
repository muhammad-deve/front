import { clearSessionCookie } from "../_lib"

export const runtime = "nodejs"

export async function POST() {
  await clearSessionCookie()
  return Response.json({ ok: true })
}
