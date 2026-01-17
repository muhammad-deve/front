import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (!body.message || typeof body.message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            )
        }

        // Proxy to Golang backend
        const backendUrl = process.env.PB_URL || "http://127.0.0.1:8090"
        const response = await fetch(`${backendUrl}/api/v1/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: body.message,
                conversationHistory: body.conversationHistory || [],
                userId: body.userId,
                context: body.context || {},
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("Backend chat error:", response.status, errorText)
            return NextResponse.json(
                { error: "Oops! I'm having trouble connecting. Please try again." },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Chat API error:", error)
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}
