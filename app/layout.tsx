import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { StreamlyChat } from "@/components/streamly-chat"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StreamVault - Premium Streaming",
  description: "Watch movies, TV series, and live TV channels in premium quality",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="cinema"
          enableSystem={false}
          themes={["cinema", "ocean"]}
        >
          <AuthProvider>
            {children}
            <StreamlyChat />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}