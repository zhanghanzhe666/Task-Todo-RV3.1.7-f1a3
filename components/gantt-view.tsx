"use client"

import { useState, useMemo } from "react"
import { format, addDays, startOfWeek, eachDayOfInterval, isToday } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Task, Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface GanttViewProps {
  tasks: Task[]
  categories: Category[]
  onSelectTask?: (taskId: string) => void
}

export default function GanttView({ tasks, categories, onSelectTask }: GanttViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [visibleDays, setVisibleDays] = useState(14) // 默认显示两周

  // 计算当前视图的开始和结束日期
  const startDate = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }) // 从周一开始
    return start
  }, [currentDate])

  const endDate = useMemo(() => {
    return addDays(startDate, visibleDays - 1)
  }, [startDate, visibleDays])

  // 生成日期范围
  const dateRange = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [startDate, endDate])

  // 过滤有截止日期的任务
  const tasksWithDates = useMemo(() => {
    return tasks.filter((task) => task.dueDate !== null)
  }, [tasks])

  // 按分类分组任务
  const tasksByCategory = useMemo(() => {
    const result: Record<string, Task[]> = {}

    // 先添加有分类的任务
    tasksWithDates.forEach((task) => {
      if (task.categoryId) {
        if (!result[task.categoryId]) {
          result[task.categoryId] = []
        }
        result[task.categoryId].push(task)
      }
    })

    // 添加无分类的任务
    const uncategorizedTasks = tasksWithDates.filter((task) => !task.categoryId)
    if (uncategorizedTasks.length > 0) {
      result["uncategorized"] = uncategorizedTasks
    }

    return result
  }, [tasksWithDates])

  // 前一周期
  const prevPeriod = () => {
    setCurrentDate(addDays(currentDate, -visibleDays))
  }

  // 下一周期
  const nextPeriod = () => {
    setCurrentDate(addDays(currentDate, visibleDays))
  }

  // 返回今天
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 计算任务在甘特图中的位置和宽度
  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return null

    const taskDate = new Date(task.dueDate)

    // 检查任务日期是否在当前视图范围内
    if (taskDate < startDate || taskDate > endDate) {
      return null
    }

    // 计算任务在视图中的位置（从左侧开始的百分比）
    const totalDays = visibleDays
    const daysDiff = Math.floor((taskDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const leftPosition = (daysDiff / totalDays) * 100

    return {
      left: `${leftPosition}%`,
      width: `${100 / totalDays}%`,
    }
  }

  // 获取分类颜色
  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return "#94a3b8" // 默认颜色
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.color : "#94a3b8"
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
            value={visibleDays}
            onChange={(e) => setVisibleDays(Number(e.target.value))}
          >
            <option value="7">一周</option>
            <option value="14">两周</option>
            <option value="30">一个月</option>
          </select>
        </div>
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          {/* 日期头部 */}
          <div className="grid grid-cols-1 border-b border-border">
            <div className="flex">
              <div className="w-48 min-w-48 border-r border-border p-2 bg-muted/30">
                <div className="font-medium">分类 / 任务</div>
              </div>
              <div className="flex-1 overflow-x-auto">
                <div className="flex min-w-full">
                  {dateRange.map((date, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex-1 text-center p-2 border-r border-border last:border-r-0 min-w-[80px]",
                        isToday(date) && "bg-primary/10",
                      )}
                    >
                      <div className="text-sm font-medium">{format(date, "MM/dd", { locale: zhCN })}</div>
                      <div className="text-xs text-muted-foreground">{format(date, "EEE", { locale: zhCN })}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 甘特图主体 */}
          <div className="grid grid-cols-1">
            {Object.entries(tasksByCategory).map(([categoryId, categoryTasks]) => {
              const category = categories.find((c) => c.id === categoryId)
              return (
                <div key={categoryId} className="border-b border-border last:border-b-0">
                  {/* 分类标题 */}
                  <div className="flex">
                    <div className="w-48 min-w-48 border-r border-border p-2 font-medium flex items-center gap-2 bg-muted/30">
                      {categoryId !== "uncategorized" && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(categoryId) }}
                        />
                      )}
                      <span>{categoryId === "uncategorized" ? "未分类" : category?.name}</span>
                    </div>
                    <div className="flex-1 relative overflow-x-auto">
                      <div className="flex min-w-full h-10">
                        {dateRange.map((date, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex-1 border-r border-border last:border-r-0 min-w-[80px]",
                              isToday(date) && "bg-primary/5",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 任务条目 */}
                  {categoryTasks.map((task) => {
                    const position = getTaskPosition(task)
                    if (!position) return null

                    return (
                      <div key={task.id} className="flex">
                        <div
                          className="w-48 min-w-48 border-r border-border p-2 truncate hover:text-primary cursor-pointer"
                          onClick={() => onSelectTask?.(task.id)}
                        >
                          <div className="text-sm truncate">{task.title}</div>
                        </div>
                        <div className="flex-1 relative overflow-x-auto">
                          <div className="flex min-w-full h-10 relative">
                            {dateRange.map((date, index) => (
                              <div
                                key={index}
                                className={cn(
                                  "flex-1 border-r border-border last:border-r-0 min-w-[80px]",
                                  isToday(date) && "bg-primary/5",
                                )}
                              />
                            ))}

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.div
                                    className={cn(
                                      "absolute top-1 h-8 rounded-md cursor-pointer",
                                      task.completed ? "opacity-60" : "hover:brightness-90",
                                    )}
                                    style={{
                                      left: position.left,
                                      width: position.width,
                                      backgroundColor: getCategoryColor(task.categoryId),
                                    }}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelectTask?.(task.id)}
                                  >
                                    <div
                                      className={cn(
                                        "h-full w-full flex items-center justify-center text-xs font-medium text-white truncate px-1",
                                        task.completed && "line-through",
                                      )}
                                    >
                                      {task.title}
                                    </div>
                                  </motion.div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <div className="font-medium">{task.title}</div>
                                    {task.description && <div className="text-xs">{task.description}</div>}
                                    <div className="text-xs">
                                      截止日期: {format(new Date(task.dueDate!), "yyyy-MM-dd", { locale: zhCN })}
                                    </div>
                                    <div className="text-xs">状态: {task.completed ? "已完成" : "未完成"}</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* 如果没有任务，显示空状态 */}
            {Object.keys(tasksByCategory).length === 0 && (
              <div className="flex justify-center items-center p-8 text-muted-foreground">
                没有找到带有截止日期的任务
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
