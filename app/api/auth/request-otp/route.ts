import nodemailer from "nodemailer"
import { generateOtp5, storeOtp } from "../_lib"
import { getPocketBaseAuthorizationHeaderValue, pbBaseUrl } from "../../pb/_auth"

export const runtime = "nodejs"

function requireEnv(name: string): string {
  const v = (process.env[name] || "").trim()
  if (!v) throw new Error(`Missing ${name} env var`)
  return v
}

async function pbFetch(path: string, init?: RequestInit) {
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

async function pbUserExists(email: string): Promise<boolean> {
  const safeEmail = email.replaceAll('"', "\\\"")
  const url = new URL("/api/collections/users/records", pbBaseUrl())
  url.searchParams.set("page", "1")
  url.searchParams.set("perPage", "1")
  url.searchParams.set("filter", `email=\"${safeEmail}\"`)
  url.searchParams.set("fields", "id")

  const res = await pbFetch(url.pathname + url.search)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`PocketBase user lookup failed: ${res.status} ${text}`)
  }
  const json = (await res.json().catch(() => null)) as { items?: Array<{ id?: unknown }> } | null
  return typeof json?.items?.[0]?.id === "string"
}

type OtpMailPurpose = "signup" | "signin" | "reset"

function purposeCopy(purpose: OtpMailPurpose): { subtitle: string; intro: string } {
  if (purpose === "reset") {
    return {
      subtitle: "Secure password reset verification",
      intro: "We received a password reset request for",
    }
  }
  return {
    subtitle: "Secure sign-in verification",
    intro: "We received a request to sign in / sign up for",
  }
}

function otpEmailHtml(opts: { otp: string; toEmail: string; purpose: OtpMailPurpose }): string {
  const { otp, toEmail, purpose } = opts
  const copy = purposeCopy(purpose)
  const digits = otp.split("")

  const otpBoxes = digits
    .map(
      (d) => `
      <td style="padding:0 6px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="width:52px;height:56px;border-radius:14px;border:1px solid #2b2f36;background:#12141a;color:#ffffff;text-align:center;vertical-align:middle;font-size:26px;font-weight:800;letter-spacing:0.02em;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;box-shadow:0 10px 30px rgba(0,0,0,.35);">
              ${d}
            </td>
          </tr>
        </table>
      </td>
    `,
    )
    .join("")

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your StreamVault verification code</title>
  </head>
  <body style="margin:0;background:#0b0c10;padding:24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
      <tr>
        <td style="padding:0 0 16px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="width:44px;height:44px;border-radius:12px;background:#f59e0b;text-align:center;vertical-align:middle;color:#0b0c10;font-weight:900;font-size:16px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">SV</td>
              <td style="padding-left:12px;vertical-align:middle;">
                <div style="color:#ffffff;font-size:18px;font-weight:800;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">StreamVault</div>
                <div style="color:#a7b0c0;font-size:12px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">${copy.subtitle}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="background:#0f1117;border:1px solid #1f2430;border-radius:18px;padding:22px;">
          <div style="color:#ffffff;font-size:20px;font-weight:900;margin-bottom:6px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">Your verification code</div>
          <div style="color:#a7b0c0;font-size:13px;line-height:1.5;margin-bottom:18px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
            ${copy.intro} <span style="color:#ffffff;font-weight:700;">${toEmail}</span>.
            Enter this 5-digit code to continue. This code expires in 10 minutes.
          </div>

          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 16px auto;">
            <tr>
              ${otpBoxes}
            </tr>
          </table>

          <div style="color:#a7b0c0;font-size:12px;line-height:1.5;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
            If you didn't request this, you can ignore this email.
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:16px 2px 0 2px;color:#6c7380;font-size:12px;line-height:1.5;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
          This message was sent automatically by StreamVault.
        </td>
      </tr>
    </table>
  </body>
</html>`
}


export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: unknown; purpose?: unknown }
      | null

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const purpose = typeof body?.purpose === "string" ? body.purpose : "signup"

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 })
    }
    if (purpose !== "signup" && purpose !== "signin" && purpose !== "reset") {
      return Response.json({ error: "Invalid purpose" }, { status: 400 })
    }

    const exists = await pbUserExists(email)
    if (purpose === "signup" && exists) {
      return Response.json({ error: "Email already registered" }, { status: 400 })
    }
    if (purpose === "signin" && !exists) {
      return Response.json({ error: "Account not found" }, { status: 400 })
    }
    if (purpose === "reset" && !exists) {
      return Response.json({ error: "Account not found" }, { status: 400 })
    }

    const otp = generateOtp5()
    await storeOtp(email, purpose, otp)

    const host = requireEnv("SMTP_HOST")
    const port = Number(requireEnv("SMTP_PORT"))
    const secure = String(process.env.SMTP_SECURE || "").trim().toLowerCase() === "true"
    const user = requireEnv("SMTP_USER")
    const pass = requireEnv("SMTP_PASS")
    const from = (process.env.SMTP_FROM || user).trim()

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from,
      to: email,
      subject: purpose === "reset" ? `Your StreamVault password reset code: ${otp}` : `Your StreamVault code: ${otp}`,
      html: otpEmailHtml({ otp, toEmail: email, purpose }),
    })

    return Response.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
