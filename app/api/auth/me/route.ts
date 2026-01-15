import { getSessionUser } from "../_lib"

export const runtime = "nodejs"

export async function GET() {
  const user = await getSessionUser()
  return Response.json({ user })
}
