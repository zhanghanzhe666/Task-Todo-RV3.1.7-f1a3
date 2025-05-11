"use client"

import { useState, useEffect } from "react"

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 设置延迟更新 debouncedValue
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 如果 value 或 delay 改变，清除之前的定时器
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
