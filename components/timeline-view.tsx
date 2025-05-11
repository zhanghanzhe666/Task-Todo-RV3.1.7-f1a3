"use client"

import { useState, useMemo } from "react"
import { format, addDays, subDays, isSameDay, isAfter, isBefore, differenceInDays } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Task, Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface TimelineViewProps {
  tasks: Task[]
  categories: Category[]
  onSelectTask?: (taskId: string) => void
  days?: number
}

export default function TimelineView({ tasks, categories, onSelectTask, days = 14 }: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [timelineRange, setTimelineRange] = useState<"past" | "future" | "all">("all")

  // 计算时间轴的开始和结束日期
  const { startDate, endDate } = useMemo(() => {
    const today = new Date()

    if (timelineRange === "past") {
      return {
        startDate: subDays(today, days),
        endDate: today,
      }
    } else if (timelineRange === "future") {
      return {
        startDate: today,
        endDate: addDays(today, days),
      }
    } else {
      // "all" - 显示过去和未来的任务
      return {
        startDate: subDays(today, Math.floor(days / 2)),
        endDate: addDays(today, Math.floor(days / 2)),
      }
    }
  }, [timelineRange, days])

  // 过滤有截止日期的任务，并按日期排序
  const tasksWithDates = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate !== null)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate!)
        const dateB = new Date(b.dueDate!)
        return dateA.getTime() - dateB.getTime()
      })
  }, [tasks])

  // 按日期分组任务
  const tasksByDate = useMemo(() => {
    const result: Record<string, Task[]> = {}

    // 创建日期范围内的每一天
    let currentDay = new Date(startDate)
    while (!isAfter(currentDay, endDate)) {
      const dateKey = format(currentDay, "yyyy-MM-dd")
      result[dateKey] = []
      currentDay = addDays(currentDay, 1)
    }

    // 将任务分配到对应的日期
    tasksWithDates.forEach((task) => {
      const taskDate = new Date(task.dueDate!)
      const dateKey = format(taskDate, "yyyy-MM-dd")

      // 只添加在时间范围内的任务
      if (!isBefore(taskDate, startDate) && !isAfter(taskDate, endDate) && result[dateKey]) {
        result[dateKey].push(task)
      }
    })

    return result
  }, [tasksWithDates, startDate, endDate])

  // 获取分类颜色
  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return "#94a3b8" // 默认颜色
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.color : "#94a3b8"
  }

  // 获取分类名称
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "无分类"
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "无分类"
  }

  // 前一时间段
  const prevPeriod = () => {
    if (timelineRange === "past") {
      setCurrentDate(subDays(currentDate, days))
    } else if (timelineRange === "future") {
      setCurrentDate(subDays(currentDate, days))
    } else {
      setCurrentDate(subDays(currentDate, days))
    }
  }

  // 下一时间段
  const nextPeriod = () => {
    if (timelineRange === "past") {
      setCurrentDate(addDays(currentDate, days))
    } else if (timelineRange === "future") {
      setCurrentDate(addDays(currentDate, days))
    } else {
      setCurrentDate(addDays(currentDate, days))
    }
  }

  // 返回今天
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 检查任务是否已逾期
  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate || task.completed) return false
    const dueDate = new Date(task.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dueDate < today
  }

  // 计算与今天的天数差
  const getDayDifference = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return differenceInDays(date, today)
  }

  // 获取日期标签文本
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diff = getDayDifference(dateStr)

    if (isSameDay(date, today)) {
      return "今天"
    } else if (diff === 1) {
      return "明天"
    } else if (diff === -1) {
      return "昨天"
    } else if (diff > 0 && diff < 7) {
      return `${diff}天后`
    } else if (diff < 0 && diff > -7) {
      return `${Math.abs(diff)}天前`
    } else {
      return format(date, "MM月dd日", { locale: zhCN })
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prevPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium text-lg">
            {format(startDate, "yyyy年MM月dd日", { locale: zhCN })} -{" "}
            {format(endDate, "yyyy年MM月dd日", { locale: zhCN })}
          </h3>
          <Button variant="ghost" size="icon" onClick={nextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            今天
          </Button>
          <select
            className="bg-background border border-input rounded-md h-9 px-3 text-sm"
            value={timelineRange}
            onChange={(e) => setTimelineRange(e.target.value as "past" | "future" | "all")}
          >
            <option value="past">过去任务</option>
            <option value="future">未来任务</option>
            <option value="all">全部任务</option>
          </select>
        </div>
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">时间轴视图</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative pl-8 pr-4 py-4">
            {/* 时间轴中心线 */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border transform -translate-x-1/2"></div>

            <AnimatePresence initial={false}>
              {Object.entries(tasksByDate).map(([dateStr, dateTasks]) => {
                const dayDiff = getDayDifference(dateStr)
                const isToday = dayDiff === 0

                return (
                  <motion.div
                    key={dateStr}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 relative"
                  >
                    {/* 日期标记点 */}
                    <div
                      className={cn(
                        "absolute left-0 w-4 h-4 rounded-full border-2 border-background z-10 transform -translate-x-1/2",
                        isToday ? "bg-primary" : dayDiff > 0 ? "bg-blue-500" : "bg-amber-500",
                      )}
                      style={{
                        top: "1.5rem",
                        boxShadow: isToday ? "0 0 0 4px rgba(var(--primary-rgb), 0.2)" : "none",
                      }}
                    ></div>

                    {/* 日期标签 */}
                    <div className="flex items-center mb-2">
                      <Badge
                        variant={isToday ? "default" : "outline"}
                        className={cn("ml-4 px-2 py-1", isToday && "bg-primary text-primary-foreground")}
                      >
                        {getDateLabel(dateStr)} · {format(new Date(dateStr), "EEE", { locale: zhCN })}
                      </Badge>

                      <div className="text-sm text-muted-foreground ml-2">
                        {format(new Date(dateStr), "yyyy年MM月dd日", { locale: zhCN })}
                      </div>
                    </div>

                    {/* 任务列表 */}
                    <div className="ml-4 space-y-3">
                      {dateTasks.length > 0 ? (
                        dateTasks.map((task) => (
                          <TooltipProvider key={task.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div
                                  whileHover={{ x: 5 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => onSelectTask?.(task.id)}
                                  className={cn(
                                    "flex items-start p-3 rounded-md border cursor-pointer transition-colors",
                                    task.completed
                                      ? "bg-muted/50 border-green-200 dark:border-green-900"
                                      : isTaskOverdue(task)
                                        ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900"
                                        : task.important
                                          ? "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900"
                                          : "bg-card hover:bg-muted/50 border-border",
                                  )}
                                >
                                  <div
                                    className="w-1 self-stretch rounded-full mr-3"
                                    style={{ backgroundColor: getCategoryColor(task.categoryId) }}
                                  ></div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4
                                        className={cn(
                                          "font-medium line-clamp-1",
                                          task.completed && "line-through text-muted-foreground",
                                        )}
                                      >
                                        {task.title}
                                      </h4>

                                      <div className="flex items-center gap-1 shrink-0">
                                        {task.completed ? (
                                          <Badge
                                            variant="outline"
                                            className="bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-900 text-green-800 dark:text-green-400"
                                          >
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> 已完成
                                          </Badge>
                                        ) : isTaskOverdue(task) ? (
                                          <Badge
                                            variant="outline"
                                            className="bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-800 dark:text-red-400"
                                          >
                                            <AlertTriangle className="h-3 w-3 mr-1" /> 已逾期
                                          </Badge>
                                        ) : task.important ? (
                                          <Badge
                                            variant="outline"
                                            className="bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-400"
                                          >
                                            重要
                                          </Badge>
                                        ) : null}
                                      </div>
                                    </div>

                                    {task.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                        {task.description}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {format(new Date(task.dueDate!), "HH:mm", { locale: zhCN })}
                                      </span>

                                      <span className="flex items-center">
                                        <div
                                          className="h-2 w-2 rounded-full mr-1"
                                          style={{ backgroundColor: getCategoryColor(task.categoryId) }}
                                        ></div>
                                        {getCategoryName(task.categoryId)}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <div className="font-medium">{task.title}</div>
                                  {task.description && <div className="text-xs max-w-xs">{task.description}</div>}
                                  <div className="text-xs">
                                    截止日期: {format(new Date(task.dueDate!), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                                  </div>
                                  <div className="text-xs">状态: {task.completed ? "已完成" : "未完成"}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))
                      ) : (
                        <div className="py-4 text-center text-muted-foreground">该日期没有任务</div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* 如果没有任务，显示空状态 */}
            {Object.values(tasksByDate).every((tasks) => tasks.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted rounded-full p-3 mb-4">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-1">没有找到任务</h3>
                <p className="text-muted-foreground">在此时间范围内没有任务</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
