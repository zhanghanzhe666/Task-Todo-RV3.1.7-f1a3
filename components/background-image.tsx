"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface BackgroundImageProps {
  imageUrl?: string
  blur?: number
  opacity?: number
}

export default function BackgroundImage({ imageUrl, blur = 10, opacity = 0.8 }: BackgroundImageProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!imageUrl) return

    const img = new Image()
    img.src = imageUrl
    img.onload = () => setLoaded(true)
    img.onerror = () => console.error("Failed to load background image")

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [imageUrl])

  if (!mounted || !imageUrl) return null

  return (
    <div
      className={cn("bg-image-container", loaded ? "opacity-100" : "opacity-0")}
      style={{
        backgroundImage: `url(${imageUrl})`,
        filter: `blur(${blur}px)`,
        opacity: opacity,
      }}
      aria-hidden="true"
    />
  )
}
