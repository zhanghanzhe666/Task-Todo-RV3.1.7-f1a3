"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function ClockView() {
  const [time, setTime] = useState(new Date())
  const { theme } = useTheme()
  const hourHandRef = useRef<HTMLDivElement>(null)
  const minuteHandRef = useRef<HTMLDivElement>(null)
  const secondHandRef = useRef<HTMLDivElement>(null)
  const markingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 创建时钟刻度
    if (markingsRef.current) {
      markingsRef.current.innerHTML = ""
      for (let i = 0; i < 60; i++) {
        const span = document.createElement("span")
        const angle = i * 6
        span.style.transform = `rotate(${angle}deg) translateY(-120px)`
        markingsRef.current.appendChild(span)
      }
    }

    // 更新时间
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // 更新时钟指针
    const hours = time.getHours() % 12
    const minutes = time.getMinutes()
    const seconds = time.getSeconds()

    const hourAngle = hours * 30 + minutes * 0.5
    const minuteAngle = minutes * 6
    const secondAngle = seconds * 6

    if (hourHandRef.current) {
      hourHandRef.current.style.transform = `rotate(${hourAngle}deg)`
    }

    if (minuteHandRef.current) {
      minuteHandRef.current.style.transform = `rotate(${minuteAngle}deg)`
    }

    if (secondHandRef.current) {
      secondHandRef.current.style.transform = `rotate(${secondAngle}deg)`
    }
  }, [time])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">当前时间</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="clock-container">
            <div className="clock-face">
              <div className="clock-marking" ref={markingsRef}></div>
              <div className="clock-hour" ref={hourHandRef}></div>
              <div className="clock-minute" ref={minuteHandRef}></div>
              <div className="clock-second" ref={secondHandRef}></div>
              <div className="clock-center"></div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold tabular-nums">{format(time, "HH:mm:ss")}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {format(time, "yyyy年MM月dd日 EEEE", { locale: zhCN })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
