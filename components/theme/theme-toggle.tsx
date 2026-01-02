"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="border-white/20 dark:border-white/20 bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4 mr-2" />
          <span className="text-sm">Oscuro</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 mr-2" />
          <span className="text-sm">Claro</span>
        </>
      )}
    </Button>
  )
}
