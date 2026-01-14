"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Palette } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    const next = theme === "ocean" ? "cinema" : "ocean"
    setTheme(next)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-muted-foreground hover:text-foreground"
    >
      <Palette className="w-5 h-5" />
    </Button>
  )
}
