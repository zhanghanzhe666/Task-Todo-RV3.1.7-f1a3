"use client"

import { Button } from "@/components/ui/button"

import type React from "react"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle2,
  Star,
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import type { Task, Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from "date-fns"
import { zhCN } from "date-fns/locale"

interface StatsViewProps {
  tasks: Task[]
  categories: Category[]
}

export default function StatsView({ tasks, categories }: StatsViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState("overview")

  // 计算任务统计数据
  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.completed).length
    const important = tasks.filter((task) => task.important).length
    const withDueDate = tasks.filter((task) => task.dueDate !== null).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 计算今天到期的任务
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueToday = tasks.filter((task) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === today.getTime()
    }).length

    // 计算已逾期的任务
    const overdue = tasks.filter((task) => {
      if (!task.dueDate || task.completed) return false
      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today
    }).length

    // 按分类统计任务
    const byCategory = categories
      .map((category) => {
        const categoryTasks = tasks.filter((task) => task.categoryId === category.id)
        const categoryCompleted = categoryTasks.filter((task) => task.completed).length
        const categoryCompletionRate =
          categoryTasks.length > 0 ? Math.round((categoryCompleted / categoryTasks.length) * 100) : 0

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          count: categoryTasks.length,
          completed: categoryCompleted,
          completionRate: categoryCompletionRate,
        }
      })
      .sort((a, b) => b.count - a.count)

    // 按月统计任务完成情况
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return {
        month: date.toLocaleDateString("zh-CN", { month: "short" }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        yearMonth: `${date.getFullYear()}-${date.getMonth()}`,
      }
    }).reverse()

    const byMonth = last6Months.map((monthData) => {
      const monthTasks = tasks.filter((task) => {
        if (!task.createdAt) return false
        const createdDate = new Date(task.createdAt)
        return createdDate.getMonth() === monthData.monthIndex && createdDate.getFullYear() === monthData.year
      })

      const monthCompleted = monthTasks.filter((task) => task.completed).length

      return {
        month: monthData.month,
        year: monthData.year,
        count: monthTasks.length,
        completed: monthCompleted,
        completionRate: monthTasks.length > 0 ? Math.round((monthCompleted / monthTasks.length) * 100) : 0,
      }
    })

    // 计算当前月份的任务热力图数据
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const heatmapData = daysInMonth.map((day) => {
      const dayTasks = tasks.filter((task) => {
        if (!task.dueDate) return false
        return isSameDay(new Date(task.dueDate), day)
      })

      return {
        date: day,
        count: dayTasks.length,
        completed: dayTasks.filter((task) => task.completed).length,
      }
    })

    // 计算任务完成趋势
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      return date
    }).reverse()

    const completionTrend = last30Days.map((day) => {
      const dayTasks = tasks.filter((task) => {
        if (!task.createdAt) return false
        const createdDate = new Date(task.createdAt)
        createdDate.setHours(0, 0, 0, 0)
        return createdDate.getTime() === day.getTime()
      })

      const completedTasks = dayTasks.filter((task) => task.completed)

      return {
        date: day,
        total: dayTasks.length,
        completed: completedTasks.length,
        rate: dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0,
      }
    })

    // 计算与上月相比的变化
    const thisMonth = new Date()
    const lastMonth = subMonths(thisMonth, 1)

    const thisMonthTasks = tasks.filter((task) => {
      if (!task.createdAt) return false
      const date = new Date(task.createdAt)
      return date.getMonth() === thisMonth.getMonth() && date.getFullYear() === thisMonth.getFullYear()
    })

    const lastMonthTasks = tasks.filter((task) => {
      if (!task.createdAt) return false
      const date = new Date(task.createdAt)
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()
    })

    const taskCountChange =
      lastMonthTasks.length > 0 ? ((thisMonthTasks.length - lastMonthTasks.length) / lastMonthTasks.length) * 100 : 0

    const thisMonthCompleted = thisMonthTasks.filter((task) => task.completed).length
    const lastMonthCompleted = lastMonthTasks.filter((task) => task.completed).length

    const completionChange =
      lastMonthCompleted > 0 ? ((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100 : 0

    return {
      total,
      completed,
      important,
      withDueDate,
      completionRate,
      dueToday,
      overdue,
      byCategory,
      byMonth,
      heatmapData,
      completionTrend,
      taskCountChange,
      completionChange,
      thisMonthTasks: thisMonthTasks.length,
      thisMonthCompleted,
    }
  }, [tasks, categories, currentMonth])

  // 热力图日期导航
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => (direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)))
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="h-4 w-4" /> 概览
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <PieChart className="h-4 w-4" /> 分类分析
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> 趋势
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1.5">
            <Calendar className="h-4 w-4" /> 热力图
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <StatCard
                title="总任务数"
                value={stats.total}
                icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
                description={`已完成 ${stats.completed} 个任务`}
                change={stats.taskCountChange}
                changeLabel="较上月"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="完成率"
                value={`${stats.completionRate}%`}
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                description={`${stats.completed} / ${stats.total}`}
                change={stats.completionChange}
                changeLabel="较上月"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="重要任务"
                value={stats.important}
                icon={<Star className="h-5 w-5 text-amber-500" />}
                description={`占总任务的 ${stats.total > 0 ? Math.round((stats.important / stats.total) * 100) : 0}%`}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="今日到期"
                value={stats.dueToday}
                icon={<Calendar className="h-5 w-5 text-indigo-500" />}
                description={stats.overdue > 0 ? `${stats.overdue} 个任务已逾期` : "没有逾期任务"}
                alert={stats.overdue > 0}
              />
            </motion.div>
          </motion.div>

          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">按分类统计</CardTitle>
                  <CardDescription>任务在各分类中的分布情况</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.byCategory.length === 0 ? (
                    <div className="flex justify-center items-center h-40 text-muted-foreground">没有分类数据</div>
                  ) : (
                    <div className="space-y-4">
                      {stats.byCategory.map((category) => (
                        <div key={category.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                              <span className="font-medium">{category.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {category.completed}/{category.count} ({category.completionRate}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: category.color,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${category.completionRate}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">月度趋势</CardTitle>
                  <CardDescription>近6个月任务创建和完成情况</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.byMonth.every((m) => m.count === 0) ? (
                    <div className="flex justify-center items-center h-40 text-muted-foreground">
                      没有足够的历史数据
                    </div>
                  ) : (
                    <div className="h-64 flex items-end justify-between gap-2">
                      {stats.byMonth.map((month, index) => {
                        const height =
                          month.count > 0
                            ? Math.max(20, (month.count / Math.max(...stats.byMonth.map((m) => m.count))) * 100)
                            : 0
                        const completedHeight = month.count > 0 ? (month.completed / month.count) * height : 0

                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col items-center justify-end h-52">
                              <motion.div
                                className="relative w-full max-w-[40px] bg-muted rounded-t-md"
                                style={{ height: `${height}%` }}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              >
                                <motion.div
                                  className="absolute bottom-0 w-full bg-primary rounded-t-md"
                                  style={{ height: `${completedHeight}%` }}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${completedHeight}%` }}
                                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                />
                              </motion.div>
                            </div>
                            <div className="mt-2 text-xs text-center">
                              <div>{month.month}</div>
                              <div className="text-muted-foreground">{month.count}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">分类分布</CardTitle>
                  <CardDescription>任务在各分类中的数量分布</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.byCategory.length === 0 ? (
                    <div className="flex justify-center items-center h-40 text-muted-foreground">没有分类数据</div>
                  ) : (
                    <div className="relative h-[300px]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-[200px] h-[200px]">
                          {stats.byCategory.map((category, index) => {
                            const total = stats.byCategory.reduce((acc, cat) => acc + cat.count, 0)
                            const percentage = total > 0 ? (category.count / total) * 100 : 0
                            const startAngle =
                              index === 0
                                ? 0
                                : stats.byCategory.slice(0, index).reduce((acc, cat) => {
                                    const catTotal = stats.byCategory.reduce((a, c) => a + c.count, 0)
                                    return acc + (catTotal > 0 ? (cat.count / catTotal) * 360 : 0)
                                  }, 0)
                            const endAngle = startAngle + (percentage * 360) / 100

                            return (
                              <motion.div
                                key={category.id}
                                className="absolute inset-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                              >
                                <svg width="100%" height="100%" viewBox="0 0 100 100">
                                  <motion.path
                                    d={`M 50 50 L ${50 + 45 * Math.cos((startAngle * Math.PI) / 180)} ${50 + 45 * Math.sin((startAngle * Math.PI) / 180)} A 45 45 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${50 + 45 * Math.cos((endAngle * Math.PI) / 180)} ${50 + 45 * Math.sin((endAngle * Math.PI) / 180)} Z`}
                                    fill={category.color}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, ease: "easeInOut" }}
                                  />
                                </svg>
                              </motion.div>
                            )
                          })}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold">{stats.total}</div>
                              <div className="text-sm text-muted-foreground">总任务数</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 flex flex-col justify-center">
                        <div className="space-y-2">
                          {stats.byCategory.map((category) => (
                            <div key={category.id} className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                              <span className="text-sm">{category.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{category.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">完成率对比</CardTitle>
                  <CardDescription>各分类任务的完成情况对比</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.byCategory.length === 0 ? (
                    <div className="flex justify-center items-center h-40 text-muted-foreground">没有分类数据</div>
                  ) : (
                    <div className="space-y-6">
                      {stats.byCategory.map((category, index) => (
                        <div key={category.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                              <span className="font-medium">{category.name}</span>
                            </div>
                            <span className="text-sm font-medium">{category.completionRate}%</span>
                          </div>
                          <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                              <div>
                                <span className="text-xs font-semibold inline-block text-primary">
                                  {category.completed}/{category.count}
                                </span>
                              </div>
                            </div>
                            <div className="flex h-2 overflow-hidden text-xs bg-muted rounded-full">
                              <motion.div
                                style={{ width: `${category.completionRate}%`, backgroundColor: category.color }}
                                className="flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${category.completionRate}%` }}
                                transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="trends" className="mt-0">
          <motion.div className="grid grid-cols-1 gap-6" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">任务完成趋势</CardTitle>
                  <CardDescription>近30天任务完成情况趋势</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.completionTrend.every((day) => day.total === 0) ? (
                    <div className="flex justify-center items-center h-40 text-muted-foreground">
                      没有足够的历史数据
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <div className="relative h-full">
                        <div className="absolute left-0 bottom-0 top-8 w-10 flex flex-col justify-between">
                          <div className="text-xs text-muted-foreground">100%</div>
                          <div className="text-xs text-muted-foreground">75%</div>
                          <div className="text-xs text-muted-foreground">50%</div>
                          <div className="text-xs text-muted-foreground">25%</div>
                          <div className="text-xs text-muted-foreground">0%</div>
                        </div>
                        <div className="absolute left-10 right-0 bottom-0 top-8">
                          <div className="relative h-full">
                            <div className="absolute inset-0 flex flex-col justify-between">
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                            </div>
                            <div className="absolute inset-0">
                              <svg
                                width="100%"
                                height="100%"
                                viewBox={`0 0 ${stats.completionTrend.length} 100`}
                                preserveAspectRatio="none"
                              >
                                <motion.path
                                  d={`M 0 ${100 - stats.completionTrend[0].rate} ${stats.completionTrend.map((day, i) => `L ${i} ${100 - day.rate}`).join(" ")}`}
                                  fill="none"
                                  stroke="hsl(var(--primary))"
                                  strokeWidth="2"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                                <motion.path
                                  d={`M 0 ${100 - stats.completionTrend[0].rate} ${stats.completionTrend.map((day, i) => `L ${i} ${100 - day.rate}`).join(" ")} L ${stats.completionTrend.length - 1} 100 L 0 100 Z`}
                                  fill="hsl(var(--primary) / 0.1)"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 1, delay: 0.5 }}
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between">
                          {[0, 7, 14, 21, 29].map((index) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              {format(stats.completionTrend[index]?.date || new Date(), "MM/dd")}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">任务创建与完成对比</CardTitle>
                  <CardDescription>近6个月任务创建与完成数量对比</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.byMonth.every((m) => m.count === 0) ? (
                    <div className="flex justify-center items-center h-40 text-muted-foreground">
                      没有足够的历史数据
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <div className="relative h-full">
                        <div className="absolute left-0 bottom-0 top-8 w-10 flex flex-col justify-between">
                          <div className="text-xs text-muted-foreground">
                            {Math.max(...stats.byMonth.map((m) => m.count))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(Math.max(...stats.byMonth.map((m) => m.count)) * 0.75)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(Math.max(...stats.byMonth.map((m) => m.count)) * 0.5)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(Math.max(...stats.byMonth.map((m) => m.count)) * 0.25)}
                          </div>
                          <div className="text-xs text-muted-foreground">0</div>
                        </div>
                        <div className="absolute left-10 right-0 bottom-6 top-8">
                          <div className="relative h-full">
                            <div className="absolute inset-0 flex flex-col justify-between">
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                            </div>
                            <div className="absolute inset-0 flex items-end justify-around">
                              {stats.byMonth.map((month, index) => {
                                const maxCount = Math.max(...stats.byMonth.map((m) => m.count))
                                const totalHeight = maxCount > 0 ? (month.count / maxCount) * 100 : 0
                                const completedHeight = maxCount > 0 ? (month.completed / maxCount) * 100 : 0

                                return (
                                  <div key={index} className="flex-1 flex flex-col items-center">
                                    <div className="relative w-12 h-full">
                                      <motion.div
                                        className="absolute bottom-0 w-5 bg-muted/50 rounded-t"
                                        style={{ height: `${totalHeight}%`, left: 0 }}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${totalHeight}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                      />
                                      <motion.div
                                        className="absolute bottom-0 w-5 bg-primary rounded-t"
                                        style={{ height: `${completedHeight}%`, right: 0 }}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${completedHeight}%` }}
                                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-around">
                          {stats.byMonth.map((month, index) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              {month.month}
                            </div>
                          ))}
                        </div>
                        <div className="absolute right-0 top-8 flex items-center gap-2">
                          <div className="h-3 w-3 bg-muted/50 rounded-sm"></div>
                          <span className="text-xs text-muted-foreground">创建</span>
                          <div className="h-3 w-3 bg-primary rounded-sm ml-2"></div>
                          <span className="text-xs text-muted-foreground">完成</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="heatmap" className="mt-0">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">任务热力图</CardTitle>
                  <CardDescription>{format(currentMonth, "yyyy年MM月", { locale: zhCN })}任务分布</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                    上月
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                    下月
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
                    <div key={day} className="text-center text-xs text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}

                  {/* 填充月初前的空白 */}
                  {Array.from({ length: stats.heatmapData[0]?.date.getDay() || 0 }).map((_, i) => (
                    <div key={`empty-start-${i}`} className="h-10"></div>
                  ))}

                  {stats.heatmapData.map((day, index) => {
                    const intensity = day.count > 0 ? Math.min(1, day.count / 5) : 0
                    const completionRate = day.count > 0 ? day.completed / day.count : 0

                    return (
                      <motion.div
                        key={index}
                        className={cn(
                          "h-10 rounded-md flex items-center justify-center cursor-pointer relative",
                          day.count > 0 ? "hover:ring-1 hover:ring-primary" : "hover:bg-muted/50",
                        )}
                        style={{
                          backgroundColor: day.count > 0 ? `rgba(var(--primary-rgb), ${intensity * 0.3})` : undefined,
                        }}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.01 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="text-xs font-medium">{day.date.getDate()}</div>
                        {day.count > 0 && (
                          <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
                            <div className="text-[8px] font-medium text-muted-foreground">{day.count}</div>
                            {day.completed > 0 && (
                              <div
                                className="h-1 w-1 rounded-full"
                                style={{
                                  backgroundColor: `rgba(var(--primary-rgb), ${completionRate})`,
                                }}
                              ></div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}

                  {/* 填充月末后的空白 */}
                  {Array.from({
                    length: 6 - (stats.heatmapData[stats.heatmapData.length - 1]?.date.getDay() || 0),
                  }).map((_, i) => (
                    <div key={`empty-end-${i}`} className="h-10"></div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="text-xs text-muted-foreground">任务密度:</div>
                  <div className="flex items-center gap-1">
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, i) => (
                      <div
                        key={i}
                        className="h-3 w-3 rounded-sm"
                        style={{
                          backgroundColor: `rgba(var(--primary-rgb), ${intensity * 0.3})`,
                        }}
                      ></div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground ml-4">少</div>
                  <div className="text-xs text-muted-foreground">→</div>
                  <div className="text-xs text-muted-foreground">多</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function StatCard({
  title,
  value,
  icon,
  description,
  alert = false,
  change,
  changeLabel,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  description: string
  alert?: boolean
  change?: number
  changeLabel?: string
}) {
  const isPositiveChange = change && change > 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-full">{icon}</div>
        </div>
        <p className={cn("text-xs mt-2", alert ? "text-destructive" : "text-muted-foreground")}>{description}</p>

        {typeof change !== "undefined" && (
          <div className="mt-3 flex items-center gap-1">
            <div
              className={cn(
                "text-xs font-medium flex items-center gap-0.5",
                isPositiveChange ? "text-green-500" : "text-red-500",
              )}
            >
              {isPositiveChange ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </div>
            {changeLabel && <div className="text-xs text-muted-foreground">{changeLabel}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
