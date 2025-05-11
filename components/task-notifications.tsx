"use client"

import { useEffect, useState } from "react"
import { Bell, Calendar, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { format, isToday, isTomorrow, addDays, isBefore } from "date-fns"
import { zhCN } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"

interface TaskNotificationsProps {
  tasks: Task[]
  onSelectTask: (taskId: string) => void
}

export default function TaskNotifications({ tasks, onSelectTask }: TaskNotificationsProps) {
  const [notifications, setNotifications] = useState<{ id: string; task: Task; type: "overdue" | "upcoming" }[]>([])
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // 检查通知权限
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasPermission(Notification.permission === "granted")
    }
  }, [])

  // 请求通知权限
  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission()
        setHasPermission(permission === "granted")

        if (permission === "granted") {
          toast({
            title: "通知权限已授予",
            description: "您将收到任务到期提醒",
          })
        } else {
          toast({
            title: "通知权限被拒绝",
            description: "您将不会收到任务到期提醒",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("请求通知权限时出错:", error)
      }
    }
  }

  // 检查临期和逾期任务
  useEffect(() => {
    const checkTasks = () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const tomorrow = addDays(today, 1)
      const dayAfterTomorrow = addDays(today, 2)

      const newNotifications: { id: string; task: Task; type: "overdue" | "upcoming" }[] = []

      tasks.forEach((task) => {
        if (!task.dueDate || task.completed) return

        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)

        // 检查逾期任务
        if (isBefore(dueDate, today)) {
          newNotifications.push({
            id: `overdue-${task.id}`,
            task,
            type: "overdue",
          })
        }
        // 检查即将到期的任务（今天、明天或后天到期）
        else if (isToday(dueDate) || isTomorrow(dueDate) || isSameDay(dueDate, dayAfterTomorrow)) {
          newNotifications.push({
            id: `upcoming-${task.id}`,
            task,
            type: "upcoming",
          })
        }
      })

      setNotifications(newNotifications)
    }

    checkTasks()

    // 每小时检查一次
    const interval = setInterval(checkTasks, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [tasks])

  // 发送浏览器通知
  useEffect(() => {
    if (hasPermission && notifications.length > 0) {
      // 只对新添加的通知发送浏览器通知
      const sendNotification = () => {
        if (document.visibilityState === "hidden") {
          if (notifications.length > 0) {
            const overdueTasks = notifications.filter((n) => n.type === "overdue").length
            const upcomingTasks = notifications.filter((n) => n.type === "upcoming").length

            let title = ""
            let body = ""

            if (overdueTasks > 0 && upcomingTasks > 0) {
              title = `您有 ${overdueTasks} 个逾期任务和 ${upcomingTasks} 个即将到期的任务`
              body = "点击查看详情"
            } else if (overdueTasks > 0) {
              title = `您有 ${overdueTasks} 个逾期任务`
              body = "请尽快处理"
            } else if (upcomingTasks > 0) {
              title = `您有 ${upcomingTasks} 个即将到期的任务`
              body = "请注意按时完成"
            }

            if (title) {
              new Notification(title, {
                body,
                icon: "/favicon.ico",
              })
            }
          }
        }
      }

      // 当页面从隐藏变为可见时检查通知
      document.addEventListener("visibilitychange", sendNotification)

      // 初始检查
      if (document.visibilityState === "visible") {
        // 如果页面可见，显示toast通知而不是浏览器通知
        const overdueTasks = notifications.filter((n) => n.type === "overdue").length
        const upcomingTasks = notifications.filter((n) => n.type === "upcoming").length

        if (overdueTasks > 0) {
          toast({
            title: `您有 ${overdueTasks} 个逾期任务`,
            description: "请尽快处理",
            variant: "destructive",
          })
        }

        if (upcomingTasks > 0) {
          toast({
            title: `您有 ${upcomingTasks} 个即将到期的任务`,
            description: "请注意按时完成",
          })
        }
      }

      return () => {
        document.removeEventListener("visibilitychange", sendNotification)
      }
    }
  }, [hasPermission, notifications])

  // 检查两个日期是否是同一天
  function isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  // 获取任务到期日期的友好显示
  const getDueDateDisplay = (dueDate: string) => {
    const date = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isToday(date)) {
      return "今天"
    } else if (isTomorrow(date)) {
      return "明天"
    } else if (isBefore(date, today)) {
      const days = Math.abs(Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)))
      return `逾期 ${days} 天`
    } else {
      return format(date, "MM月dd日", { locale: zhCN })
    }
  }

  return (
    <div className="relative">
      <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <AnimatePresence>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {notifications.length}
                </motion.div>
              </AnimatePresence>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between p-2">
            <h3 className="font-medium">通知</h3>
            {hasPermission === false && (
              <Button variant="ghost" size="sm" onClick={requestPermission}>
                允许通知
              </Button>
            )}
          </div>

          <DropdownMenuSeparator />

          {notifications.length > 0 ? (
            <>
              {notifications
                .sort((a, b) => {
                  // 首先按类型排序（逾期在前）
                  if (a.type !== b.type) {
                    return a.type === "overdue" ? -1 : 1
                  }

                  // 然后按日期排序（较早的在前）
                  const dateA = new Date(a.task.dueDate!)
                  const dateB = new Date(b.task.dueDate!)
                  return dateA.getTime() - dateB.getTime()
                })
                .map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="p-3 cursor-pointer"
                    onClick={() => {
                      onSelectTask(notification.task.id)
                      setShowDropdown(false)
                    }}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <div
                        className={cn(
                          "mt-0.5 p-1.5 rounded-full",
                          notification.type === "overdue"
                            ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
                        )}
                      >
                        {notification.type === "overdue" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Calendar className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium line-clamp-1">{notification.task.title}</h4>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0",
                              notification.type === "overdue"
                                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-900 dark:text-red-400"
                                : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/10 dark:border-amber-900 dark:text-amber-400",
                            )}
                          >
                            {getDueDateDisplay(notification.task.dueDate!)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {notification.task.description || "无描述"}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="flex justify-center mb-2">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">没有通知</p>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
