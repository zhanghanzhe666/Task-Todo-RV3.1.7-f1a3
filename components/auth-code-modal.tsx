"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Lock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AuthCodeModalProps {
  authCode: string
  authCodeExpiry: number
  onSuccess: () => void
}

export default function AuthCodeModal({ authCode, authCodeExpiry, onSuccess }: AuthCodeModalProps) {
  const [inputCode, setInputCode] = useState("")
  const [error, setError] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isShaking, setIsShaking] = useState(false)

  useEffect(() => {
    // 检查本地存储中是否有有效的授权码
    const storedAuth = localStorage.getItem("auth_timestamp")
    if (storedAuth) {
      const timestamp = Number.parseInt(storedAuth)
      const expiryTime = timestamp + authCodeExpiry * 60 * 60 * 1000 // 转换小时为毫秒
      if (Date.now() < expiryTime) {
        onSuccess()
      }
    }
  }, [authCodeExpiry, onSuccess])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (inputCode === authCode) {
      // 保存授权时间戳到本地存储
      localStorage.setItem("auth_timestamp", Date.now().toString())
      onSuccess()
    } else {
      setError(true)
      setAttempts(attempts + 1)
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("w-full max-w-md", isShaking && "animate-shake")}
      >
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">授权访问</CardTitle>
            <CardDescription className="text-center">请输入授权码以访问任务管理系统</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authCode">授权码</Label>
                <Input
                  id="authCode"
                  type="password"
                  placeholder="请输入授权码"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value)
                    setError(false)
                  }}
                  className={cn(error && "border-destructive")}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  授权有效期: {authCodeExpiry} 小时
                  {authCodeExpiry >= 24 && ` (${Math.floor(authCodeExpiry / 24)} 天 ${authCodeExpiry % 24} 小时)`}
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-destructive text-sm"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>授权码不正确，请重试</span>
                </motion.div>
              )}

              {attempts >= 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm text-amber-600 dark:text-amber-400"
                >
                  <p>提示：如果您忘记了授权码，请联系管理员重置。</p>
                </motion.div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                验证授权
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
