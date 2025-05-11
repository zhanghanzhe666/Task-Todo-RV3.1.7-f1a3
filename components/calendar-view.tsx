"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface CalendarViewProps {
  tasks: Task[]
  onSelectDate: (date: Date | null) => void
  selectedDate: Date | null
  mini?: boolean
}

export default function CalendarView({ tasks, onSelectDate, selectedDate, mini = false }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<"month" | "week">("month")

  // 获取当前月份的第一天
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  // 获取当前月份的天数
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  // 获取当前月份第一天是星期几（0-6，0是星期日）
  const firstDayOfWeek = firstDayOfMonth.getDay()

  // 生成日历网格
  const calendarDays = []

  // 如果是周视图，只显示当前周的日期
  if (currentView === "week") {
    // 获取当前日期是星期几
    const currentDayOfWeek = currentDate.getDay() || 7 // 将星期日(0)转换为7

    // 计算本周的第一天（星期一）
    const firstDayOfCurrentWeek = new Date(currentDate)
    const diff = currentDayOfWeek - 1 // 计算与星期一的差距
    firstDayOfCurrentWeek.setDate(currentDate.getDate() - diff)

    // 添加本周的7天
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfCurrentWeek)
      date.setDate(firstDayOfCurrentWeek.getDate() + i)
      calendarDays.push({
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
      })
    }
  } else {
    // 月视图逻辑保持不变
    // 添加上个月的剩余天数
    const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      calendarDays.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDays - i),
        isCurrentMonth: false,
      })
    }

    // 添加当前月份的天数
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
        isCurrentMonth: true,
      })
    }

    // 添加下个月的开始几天，使日历网格填满
    const remainingDays = 42 - calendarDays.length // 6行7列 = 42
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i),
        isCurrentMonth: false,
      })
    }
  }

  // 检查日期是否有任务
  const hasTasksOnDate = (date: Date) => {
    const dateString = date.toDateString()
    return tasks.some((task) => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return taskDate.toDateString() === dateString
    })
  }

  // 获取日期上的任务数量
  const getTaskCountOnDate = (date: Date) => {
    const dateString = date.toDateString()
    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return taskDate.toDateString() === dateString
    }).length
  }

  // 获取日期上已完成的任务数量
  const getCompletedTaskCountOnDate = (date: Date) => {
    const dateString = date.toDateString()
    return tasks.filter((task) => {
      if (!task.dueDate || !task.completed) return false
      const taskDate = new Date(task.dueDate)
      return taskDate.toDateString() === dateString
    }).length
  }

  // 检查日期是否是今天
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // 检查日期是否被选中
  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  // 前一周/月
  const prevPeriod = () => {
    if (currentView === "week") {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() - 7)
      setCurrentDate(newDate)
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }
  }

  // 下一周/月
  const nextPeriod = () => {
    if (currentView === "week") {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + 7)
      setCurrentDate(newDate)
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }
  }

  // 返回今天
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 格式化月份和年份或周
  const formatPeriod = () => {
    if (currentView === "week") {
      const firstDay = calendarDays[0]?.date
      const lastDay = calendarDays[6]?.date
      if (firstDay && lastDay) {
        if (firstDay.getMonth() === lastDay.getMonth()) {
          return `${firstDay.getFullYear()}年${firstDay.getMonth() + 1}月 第${Math.ceil(firstDay.getDate() / 7)}周`
        } else {
          return `${firstDay.getFullYear()}年${firstDay.getMonth() + 1}月${firstDay.getDate()}日 - ${lastDay.getMonth() + 1}月${lastDay.getDate()}日`
        }
      }
      return ""
    } else {
      return currentDate.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })
    }
  }

  // 星期几的标签
  const weekDays = ["一", "二", "三", "四", "五", "六", "日"]

  // 更新渲染日历单元格的部分
  return (
    <div className={cn("w-full", mini ? "text-sm" : "")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prevPeriod} className={cn(mini ? "h-7 w-7" : "")}>
            <ChevronLeft className={cn("h-4 w-4", mini ? "h-3 w-3" : "")} />
          </Button>
          <h3 className={cn("font-medium", mini ? "text-sm" : "text-lg")}>{formatPeriod()}</h3>
          <Button variant="ghost" size="icon" onClick={nextPeriod} className={cn(mini ? "h-7 w-7" : "")}>
            <ChevronRight className={cn("h-4 w-4", mini ? "h-3 w-3" : "")} />
          </Button>
        </div>
        {!mini && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              今天
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView(currentView === "month" ? "week" : "month")}
            >
              {currentView === "month" ? "周视图" : "月视图"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={cn("text-center font-medium text-muted-foreground", mini ? "text-xs py-1" : "py-2")}
          >
            {day}
          </div>
        ))}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentView}-${currentDate.getMonth()}-${currentDate.getFullYear()}-${currentDate.getDate()}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="col-span-7 grid grid-cols-7 gap-1"
          >
            {calendarDays.map((day, index) => {
              const hasTask = hasTasksOnDate(day.date)
              const taskCount = getTaskCountOnDate(day.date)
              const completedTaskCount = getCompletedTaskCountOnDate(day.date)
              const allTasksCompleted = taskCount > 0 && completedTaskCount === taskCount
              const completionPercentage = taskCount > 0 ? (completedTaskCount / taskCount) * 100 : 0

              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: mini ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative flex flex-col items-center justify-center",
                    mini ? "h-7" : "h-16 sm:h-24",
                    day.isCurrentMonth ? "bg-card" : "bg-muted/50",
                    isSelected(day.date) && "bg-primary/10 border border-primary",
                    isToday(day.date) && !isSelected(day.date) && "border border-primary/50",
                    "rounded-md cursor-pointer hover:bg-muted transition-colors",
                  )}
                  onClick={() => onSelectDate(day.date)}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center",
                      mini ? "h-7 w-7 text-xs" : "h-8 w-8",
                      isToday(day.date) && "bg-primary text-primary-foreground rounded-full",
                    )}
                  >
                    {day.date.getDate()}
                  </div>

                  {!mini && hasTask && (
                    <div className="absolute bottom-1 flex flex-col items-center justify-center">
                      <div
                        className={cn(
                          "text-xs font-medium px-1.5 py-0.5 rounded-full",
                          taskCount > 0 && "bg-primary/20 text-primary",
                        )}
                      >
                        {completedTaskCount}/{taskCount}
                      </div>
                      {taskCount > 0 && (
                        <div className="w-12 h-1 bg-muted mt-1 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {mini && hasTask && (
                    <div className="absolute bottom-0.5 flex items-center justify-center">
                      {allTasksCompleted ? (
                        <Check className="h-2 w-2 text-green-500" />
                      ) : (
                        <div className="h-1 w-1 rounded-full bg-primary" />
                      )}
                    </div>
                  )}

                  {mini && taskCount > 0 && (
                    <div className="absolute top-0 right-0.5 text-[8px] font-medium text-muted-foreground">
                      {taskCount}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
