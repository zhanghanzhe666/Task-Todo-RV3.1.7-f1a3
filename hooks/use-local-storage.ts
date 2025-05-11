"use client"

import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // 创建状态来存储值
  // 如果可用，则从本地存储中获取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // 返回一个包装版本的 useState 的 setter 函数，
  // 它将新值同步到 localStorage
  // 修改 useLocalStorage hook 以确保正确保存数据

  // 在 setValue 函数中，确保在设置 localStorage 之前进行 JSON 序列化
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 允许值是一个函数，以便与 useState 的 API 保持一致
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // 保存到状态
      setStoredValue(valueToStore)
      // 保存到 localStorage
      if (typeof window !== "undefined") {
        // 确保使用 try-catch 包裹 localStorage 操作
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
          console.error(`Error writing to localStorage key "${key}":`, error)
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // 监听其他标签页的存储事件
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue))
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange)
      return () => {
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [key])

  // 添加一个初始化检查，确保 localStorage 可用
  useEffect(() => {
    // 检查 localStorage 是否可用
    if (typeof window !== "undefined") {
      try {
        const testKey = `test_${Math.random()}`
        window.localStorage.setItem(testKey, "test")
        window.localStorage.removeItem(testKey)
      } catch (error) {
        console.error("localStorage is not available:", error)
      }
    }
  }, [])

  return [storedValue, setValue]
}
