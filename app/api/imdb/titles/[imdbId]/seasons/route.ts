import { NextResponse } from "next/server"

export async function GET(_req: Request, ctx: { params: Promise<{ imdbId: string }> }) {
  const { imdbId } = await ctx.params
  const id = (imdbId || "").trim()
  if (!id) return NextResponse.json({ error: "Missing imdbId" }, { status: 400 })

  const url = `https://api.imdbapi.dev/titles/${encodeURIComponent(id)}/seasons`

  try {
    const res = await fetch(url, { cache: "no-store" })
    const text = await res.text()
    if (!res.ok) return NextResponse.json({ error: text || "Upstream error" }, { status: res.status })

    const json = JSON.parse(text) as unknown
    return NextResponse.json(json)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
