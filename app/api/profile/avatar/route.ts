import { getSessionUser, setSessionCookie } from "../../auth/_lib"
import { getPocketBaseAuthorizationHeaderValue, pbBaseUrl } from "../../pb/_auth"

export const runtime = "nodejs"

function pbUserAvatarUrl(userId: string, avatarFilename: string): string {
  const fn = avatarFilename.trim()
  if (!fn) return ""
  return new URL(`/api/files/users/${userId}/${encodeURIComponent(fn)}`, pbBaseUrl()).toString()
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get("avatar")

    if (!(file instanceof File) || file.size <= 0) {
      return Response.json({ error: "Missing avatar file" }, { status: 400 })
    }

    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      return Response.json({ error: "Avatar file too large" }, { status: 400 })
    }

    const authorization = await getPocketBaseAuthorizationHeaderValue()

    const pbForm = new FormData()
    pbForm.append("avatar", file, file.name)

    const res = await fetch(new URL(`/api/collections/users/records/${sessionUser.id}`, pbBaseUrl()).toString(), {
      method: "PATCH",
      headers: {
        Authorization: authorization,
      },
      body: pbForm,
      cache: "no-store",
    })

    const text = await res.text().catch(() => "")
    if (!res.ok) {
      return Response.json({ error: text || "Failed to upload avatar" }, { status: 400 })
    }

    const parsed = (text ? JSON.parse(text) : null) as { avatar?: unknown } | null
    const avatarFilename = typeof parsed?.avatar === "string" ? parsed.avatar : ""
    const avatar = avatarFilename ? pbUserAvatarUrl(sessionUser.id, avatarFilename) : undefined

    const nextUser = { ...sessionUser, avatar }
    await setSessionCookie(nextUser)

    return Response.json({ ok: true, user: nextUser })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
