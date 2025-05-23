"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Play, Pause, RotateCcw, Check, Clock, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"

interface FocusModeProps {
  tasks: Task[]
  onTaskComplete: (taskId: string) => void
}

export default function FocusMode({ tasks, onTaskComplete }: FocusModeProps) {
  const [duration, setDuration] = useState(25)
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  const [showNotification, setShowNotification] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fireworksContainerRef = useRef<HTMLDivElement>(null)

  // 重置计时器
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setTimeLeft(duration * 60)
    setIsRunning(false)
    setCompleted(false)
  }

  // 开始/暂停计时器
  const toggleTimer = () => {
    if (isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setIsRunning(false)
    } else {
      if (timeLeft > 0) {
        // 发送开始专注通知
        if (showNotification && "Notification" in window && Notification.permission === "granted") {
          new Notification("专注模式已开始", {
            body: `您将专注 ${formatTime(timeLeft)} 分钟${selectedTaskId ? `，完成任务：${tasks.find((t) => t.id === selectedTaskId)?.title}` : ""}`,
            icon: "/favicon.ico",
          })
        } else {
          toast({
            title: "专注模式已开始",
            description: `您将专注 ${formatTime(timeLeft)} 分钟${selectedTaskId ? `，完成任务：${tasks.find((t) => t.id === selectedTaskId)?.title}` : ""}`,
          })
        }

        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current)
              }
              setIsRunning(false)
              setCompleted(true)

              // 发送完成通知
              if (showNotification && "Notification" in window && Notification.permission === "granted") {
                new Notification("专注时间结束！", {
                  body: "恭喜您完成了专注时间！",
                  icon: "/favicon.ico",
                })
              } else {
                toast({
                  title: "专注时间结束！",
                  description: "恭喜您完成了专注时间！",
                })
              }

              // 如果选择了任务，显示烟花效果
              if (selectedTaskId) {
                setShowFireworks(true)
                setTimeout(() => setShowFireworks(false), 3000)
              }

              return 0
            }
            return prev - 1
          })
        }, 1000)

        setIsRunning(true)
      }
    }
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 计算进度
  const calculateProgress = () => {
    const totalSeconds = duration * 60
    const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100
    return progress
  }

  // 完成任务
  const completeTask = () => {
    if (selectedTaskId) {
      onTaskComplete(selectedTaskId)
      toast({
        title: "任务已完成",
        description: "恭喜您完成了任务！",
      })
      setShowFireworks(true)
      setTimeout(() => setShowFireworks(false), 3000)
    }
  }

  // 创建烟花效果
  const createFireworks = () => {
    if (!fireworksContainerRef.current) return

    const container = fireworksContainerRef.current
    container.innerHTML = ""

    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]

    for (let i = 0; i < 100; i++) {
      const particle = document.createElement("div")
      particle.className = "firework-particle"

      // 随机位置
      const x = 50 + (Math.random() - 0.5) * 80
      const y = 50 + (Math.random() - 0.5) * 80

      // 随机颜色
      const color = colors[Math.floor(Math.random() * colors.length)]

      // 随机大小
      const size = 3 + Math.random() * 5

      // 随机延迟
      const delay = Math.random() * 0.5

      particle.style.left = `${x}%`
      particle.style.top = `${y}%`
      particle.style.backgroundColor = color
      particle.style.width = `${size}px`
      particle.style.height = `${size}px`
      particle.style.animationDelay = `${delay}s`

      container.appendChild(particle)
    }
  }

  // 监听烟花效果
  useEffect(() => {
    if (showFireworks) {
      createFireworks()
    }
  }, [showFireworks])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // 更新时间
  useEffect(() => {
    resetTimer()
  }, [duration])

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "通知不可用",
        description: "您的浏览器不支持通知功能",
        variant: "destructive",
      })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        toast({
          title: "通知权限已授予",
          description: "您将收到专注模式的通知提醒",
        })
      } else {
        toast({
          title: "通知权限被拒绝",
          description: "您将不会收到专注模式的通知提醒",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("请求通知权限时出错:", error)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <Target className="h-5 w-5" />
          <span>专注模式</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="focus-timer">
            <div className="focus-timer-circle"></div>
            <div
              className="focus-timer-progress"
              style={{
                transform: `rotate(${calculateProgress() * 3.6}deg)`,
                clipPath:
                  calculateProgress() > 50
                    ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
                    : "polygon(50% 0, 100% 0, 100% 100%, 50% 100%, 50% 0)",
              }}
            ></div>
            <div className="focus-timer-time tabular-nums">{formatTime(timeLeft)}</div>
            <div className="focus-timer-label">{isRunning ? "专注中..." : completed ? "已完成" : "准备开始"}</div>
          </div>

          <div className="grid w-full max-w-sm gap-2">
            <Label htmlFor="duration">专注时长 (分钟)</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="duration"
                min={5}
                max={60}
                step={5}
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                disabled={isRunning}
                className="flex-1"
              />
              <span className="w-12 text-center tabular-nums">{duration}</span>
            </div>
          </div>

          <div className="grid w-full max-w-sm gap-2">
            <Label htmlFor="task">关联任务 (可选)</Label>
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={isRunning}>
              <SelectTrigger>
                <SelectValue placeholder="选择要完成的任务" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无关联任务</SelectItem>
                {tasks
                  .filter((task) => !task.completed)
                  .map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between w-full max-w-sm">
            <Label htmlFor="notifications" className="cursor-pointer">
              启用通知提醒
            </Label>
            <div className="flex items-center gap-2">
              <Switch id="notifications" checked={showNotification} onCheckedChange={setShowNotification} />
              {showNotification && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={requestNotificationPermission}
                  type="button"
                  className="h-8 w-8"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-2">
        <Button
          variant={isRunning ? "outline" : "default"}
          onClick={toggleTimer}
          disabled={completed}
          className={cn(
            "w-24",
            isRunning &&
              "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30",
          )}
        >
          {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {isRunning ? "暂停" : "开始"}
        </Button>

        <Button variant="outline" onClick={resetTimer} disabled={!isRunning && timeLeft === duration * 60}>
          <RotateCcw className="mr-2 h-4 w-4" />
          重置
        </Button>

        {selectedTaskId && completed && (
          <Button variant="default" onClick={completeTask} className="bg-green-600 text-white hover:bg-green-700">
            <Check className="mr-2 h-4 w-4" />
            完成任务
          </Button>
        )}
      </CardFooter>

      {/* 烟花效果容器 */}
      {showFireworks && <div className="fireworks-container" ref={fireworksContainerRef}></div>}
    </Card>
  )
}
