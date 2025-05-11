"use client"

import { Textarea } from "@/components/ui/textarea"
import AuthCodeModal from "@/components/auth-code-modal"
import TimelineView from "@/components/timeline-view"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  BarChart3,
  CalendarIcon,
  CheckCircle2,
  Clock,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Search,
  Settings,
  Star,
  X,
  MoreHorizontal,
  MessageSquare,
  AlertTriangle,
  Check,
  Download,
  Upload,
  GanttChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import TaskItem from "@/components/task-item"
import TaskDetail from "@/components/task-detail"
import CalendarView from "@/components/calendar-view"
import SettingsPanel from "@/components/settings-panel"
import StatsView from "@/components/stats-view"
import GanttView from "@/components/gantt-view"
import ThemeToggle from "@/components/theme-toggle"
import type { Task, Category, UserSettings, AppData } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import AIAssistant from "@/components/ai-assistant"
import { Resizable } from "re-resizable"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

// 导入通知组件
import TaskNotifications from "@/components/task-notifications"

export default function TaskDashboard() {
  // 本地存储数据
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", [])
  const [categories, setCategories] = useLocalStorage<Category[]>("categories", [
    { id: "1", name: "工作", color: "#3b82f6" },
    { id: "2", name: "个人", color: "#22c55e" },
    { id: "3", name: "购物", color: "#f59e0b" },
    { id: "4", name: "健康", color: "#ef4444" },
    { id: "5", name: "学习", color: "#8b5cf6" },
    { id: "6", name: "娱乐", color: "#ec4899" },
  ])
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>("userSettings", {
    primaryColor: "blue",
    compactMode: false,
    showAnimations: true,
    defaultView: "tasks",
    sidebarCollapsed: false,
    openaiApiKey: "",
    openaiBaseUrl: "https://api.openai.com/v1",
    openaiModel: "gpt-3.5-turbo",
    authCode: "",
    authCodeExpiry: 7,
  })

  // 状态管理
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activeView, setActiveView] = useState<"tasks" | "calendar" | "stats" | "gantt" | "timeline">(
    userSettings.defaultView as "tasks" | "calendar" | "stats" | "gantt" | "timeline",
  )
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(userSettings.sidebarCollapsed)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [aiSize, setAiSize] = useState({ width: 400, height: 500 })
  const [isCustomModel, setIsCustomModel] = useState(
    ![
      "gpt-3.5-turbo",
      "gpt-4",
      "gpt-4-turbo",
      "gpt-4o",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ].includes(userSettings.openaiModel),
  )
  const [customModel, setCustomModel] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategoryColor, setEditingCategoryColor] = useState("")
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importData, setImportData] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 保存用户设置
  // 只在这些值实际变化时才更新用户设置
  const prevActiveViewRef = useRef(activeView)
  const prevSidebarCollapsedRef = useRef(sidebarCollapsed)

  // 初始化自定义模型值
  useEffect(() => {
    if (isCustomModel) {
      setCustomModel(userSettings.openaiModel)
    }
  }, [isCustomModel, userSettings.openaiModel])

  useEffect(() => {
    if (prevActiveViewRef.current !== activeView || prevSidebarCollapsedRef.current !== sidebarCollapsed) {
      setUserSettings((prev) => ({
        ...prev,
        defaultView: activeView,
        sidebarCollapsed,
      }))

      prevActiveViewRef.current = activeView
      prevSidebarCollapsedRef.current = sidebarCollapsed
    }
  }, [activeView, sidebarCollapsed, setUserSettings])

  // 生成搜索建议
  useEffect(() => {
    if (debouncedSearchQuery.length > 1) {
      const titleSuggestions = tasks
        .filter(
          (task) =>
            task.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) &&
            !task.title.toLowerCase().startsWith(debouncedSearchQuery.toLowerCase()),
        )
        .map((task) => task.title)
        .slice(0, 3)

      const categorySuggestions = categories
        .filter((category) => category.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
        .map((category) => `分类:${category.name}`)
        .slice(0, 2)

      const newSuggestions = [...new Set([...titleSuggestions, ...categorySuggestions])]
      if (JSON.stringify(newSuggestions) !== JSON.stringify(searchSuggestions)) {
        setSearchSuggestions(newSuggestions)
      }
    } else if (searchSuggestions.length > 0) {
      setSearchSuggestions([])
    }
  }, [debouncedSearchQuery, tasks, categories])

  // 过滤任务
  useEffect(() => {
    let result = [...tasks]

    if (debouncedSearchQuery) {
      // 检查是否是分类搜索
      if (debouncedSearchQuery.toLowerCase().startsWith("分类:")) {
        const categoryName = debouncedSearchQuery.slice(3).toLowerCase()
        const categoryIds = categories
          .filter((cat) => cat.name.toLowerCase().includes(categoryName))
          .map((cat) => cat.id)

        result = result.filter((task) => task.categoryId && categoryIds.includes(task.categoryId))
      } else {
        result = result.filter(
          (task) =>
            task.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
        )
      }
    }

    if (activeFilter) {
      if (activeFilter === "completed") {
        result = result.filter((task) => task.completed)
      } else if (activeFilter === "important") {
        result = result.filter((task) => task.important)
      } else if (activeFilter === "today") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        result = result.filter((task) => {
          if (!task.dueDate) return false
          const taskDate = new Date(task.dueDate)
          taskDate.setHours(0, 0, 0, 0)
          return taskDate.getTime() === today.getTime()
        })
      } else if (activeFilter === "overdue") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        result = result.filter((task) => {
          if (!task.dueDate || task.completed) return false
          const taskDate = new Date(task.dueDate)
          taskDate.setHours(0, 0, 0, 0)
          return taskDate < today
        })
      } else {
        // 按分类过滤
        result = result.filter((task) => task.categoryId === activeFilter)
      }
    }

    if (selectedDate) {
      const selected = new Date(selectedDate)
      selected.setHours(0, 0, 0, 0)
      result = result.filter((task) => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.getTime() === selected.getTime()
      })
    }

    setFilteredTasks(result)
  }, [tasks, debouncedSearchQuery, activeFilter, selectedDate, categories])

  // 任务操作
  const addTask = (task: Task) => {
    setTasks((prev) => [task, ...prev])
    setIsFormOpen(false)
    toast({
      title: "任务已添加",
      description: `"${task.title}" 已成功添加到您的任务列表中。`,
    })
  }

  const updateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
    setViewingTask(updatedTask)
    toast({
      title: "任务已更新",
      description: `"${updatedTask.title}" 已成功更新。`,
    })
  }

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find((task) => task.id === id)
    setTasks((prev) => prev.filter((task) => task.id !== id))
    setViewingTask(null)
    toast({
      title: "任务已删除",
      description: taskToDelete ? `"${taskToDelete.title}" 已被删除。` : "任务已被删除。",
      variant: "destructive",
      action: (
        <ToastAction
          altText="撤销"
          onClick={() => {
            if (taskToDelete) {
              setTasks((prev) => [taskToDelete, ...prev])
            }
          }}
        >
          撤销
        </ToastAction>
      ),
    })
  }

  const toggleTaskCompletion = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))

    // 如果正在查看的任务被切换了完成状态，更新查看状态
    if (viewingTask && viewingTask.id === id) {
      setViewingTask((prev) => (prev ? { ...prev, completed: !prev.completed } : null))
    }
  }

  const toggleTaskImportance = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, important: !task.important } : task)))

    // 如果正在查看的任务被切换了重要状态，更新查看状态
    if (viewingTask && viewingTask.id === id) {
      setViewingTask((prev) => (prev ? { ...prev, important: !prev.important } : null))
    }
  }

  // 分类操作
  const addCategory = (category: Category) => {
    const newCategory = {
      ...category,
      id: category.id || crypto.randomUUID(),
    }
    setCategories((prev) => [...prev, newCategory])
    toast({
      title: "分类已添加",
      description: `"${newCategory.name}" 分类已成功创建。`,
    })
    return newCategory
  }

  const updateCategory = (updatedCategory: Category) => {
    setCategories((prev) => prev.map((category) => (category.id === updatedCategory.id ? updatedCategory : category)))
    setEditingCategory(null)
    toast({
      title: "分类已更新",
      description: `"${updatedCategory.name}" 分类已成功更新。`,
    })
  }

  const deleteCategory = (id: string) => {
    const categoryToDelete = categories.find((cat) => cat.id === id)
    // 删除分类前，将使用该分类的任务更新为无分类
    setTasks((prev) => prev.map((task) => (task.categoryId === id ? { ...task, categoryId: null } : task)))
    setCategories((prev) => prev.filter((category) => category.id !== id))
    setDeletingCategory(null)
    toast({
      title: "分类已删除",
      description: categoryToDelete ? `"${categoryToDelete.name}" 分类已被删除。` : "分类已被删除。",
      variant: "destructive",
    })
  }

  // 导出应用数据
  const exportAppData = () => {
    const appData: AppData = {
      tasks,
      categories,
      settings: userSettings,
      version: "1.0.0",
    }

    const dataStr = JSON.stringify(appData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    setIsExportDialogOpen(false)
    toast({
      title: "数据已导出",
      description: "您的任务和设置已成功导出为JSON文件。",
    })
  }

  // 导入应用数据
  const importAppData = () => {
    try {
      if (!importData) {
        toast({
          title: "导入失败",
          description: "没有提供数据。请上传有效的JSON文件或粘贴JSON数据。",
          variant: "destructive",
        })
        return
      }

      const appData: AppData = JSON.parse(importData)

      // 验证数据结构
      if (!appData.tasks || !appData.categories || !appData.settings) {
        throw new Error("无效的数据格式")
      }

      // 导入数据
      setTasks(appData.tasks)
      setCategories(appData.categories)
      setUserSettings(appData.settings)

      setIsImportDialogOpen(false)
      setImportData("")

      toast({
        title: "数据已导入",
        description: `成功导入 ${appData.tasks.length} 个任务和 ${appData.categories.length} 个分类。`,
      })
    } catch (error) {
      toast({
        title: "导入失败",
        description: "无法解析提供的数据。请确保上传有效的JSON文件。",
        variant: "destructive",
      })
    }
  }

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setImportData(event.target.result as string)
      }
    }
    reader.readAsText(file)
  }

  // 处理AI命令执行
  const handleAICommand = (command: any) => {
    try {
      if (!command || !command.action) return

      switch (command.action) {
        case "addTask":
          if (command.task) {
            const newTask: Task = {
              id: crypto.randomUUID(),
              title: command.task.title,
              description: command.task.description || "",
              categoryId: command.task.categoryId,
              completed: false,
              important: command.task.important || false,
              dueDate: command.task.dueDate,
              createdAt: new Date().toISOString(),
            }
            addTask(newTask)
            toast({
              title: "AI助手已添加任务",
              description: `"${newTask.title}" 已成功添加到您的任务列表中。`,
            })
          }
          break

        case "updateTask":
          if (command.taskId && command.updates) {
            const taskToUpdate = tasks.find((t) => t.id === command.taskId)
            if (taskToUpdate) {
              const updatedTask = { ...taskToUpdate, ...command.updates }
              updateTask(updatedTask)
              toast({
                title: "AI助手已更新任务",
                description: `"${updatedTask.title}" 已成功更新。`,
              })
            } else {
              toast({
                title: "更新失败",
                description: `找不到ID为 "${command.taskId}" 的任务。`,
                variant: "destructive",
              })
            }
          }
          break

        case "deleteTask":
          if (command.taskId) {
            const taskToDelete = tasks.find((t) => t.id === command.taskId)
            if (taskToDelete) {
              deleteTask(command.taskId)
              toast({
                title: "AI助手已删除任务",
                description: `"${taskToDelete.title}" 已被删除。`,
                variant: "destructive",
              })
            } else {
              toast({
                title: "删除失败",
                description: `找不到ID为 "${command.taskId}" 的任务。`,
                variant: "destructive",
              })
            }
          }
          break

        case "addCategory":
          if (command.category) {
            const newCategory: Category = {
              id: crypto.randomUUID(),
              name: command.category.name,
              color: command.category.color || "#3b82f6",
            }
            addCategory(newCategory)
            toast({
              title: "AI助手已添加分类",
              description: `"${newCategory.name}" 分类已成功创建。`,
            })
          }
          break

        case "updateCategory":
          if (command.categoryId && command.updates) {
            const categoryToUpdate = categories.find((c) => c.id === command.categoryId)
            if (categoryToUpdate) {
              const updatedCategory = { ...categoryToUpdate, ...command.updates }
              updateCategory(updatedCategory)
              toast({
                title: "AI助手已更新分类",
                description: `"${updatedCategory.name}" 分类已成功更新。`,
              })
            } else {
              toast({
                title: "更新失败",
                description: `找不到ID为 "${command.categoryId}" 的分类。`,
                variant: "destructive",
              })
            }
          }
          break

        case "deleteCategory":
          if (command.categoryId) {
            const categoryToDelete = categories.find((c) => c.id === command.categoryId)
            if (categoryToDelete) {
              deleteCategory(command.categoryId)
              toast({
                title: "AI助手已删除分类",
                description: `"${categoryToDelete.name}" 分类已被删除。`,
                variant: "destructive",
              })
            } else {
              toast({
                title: "删除失败",
                description: `找不到ID为 "${command.categoryId}" 的分类。`,
                variant: "destructive",
              })
            }
          }
          break

        default:
          console.log("未知命令:", command)
      }
    } catch (error) {
      console.error("执行AI命令时出错:", error)
      toast({
        title: "命令执行失败",
        description: "执行AI助手命令时发生错误，请重试。",
        variant: "destructive",
      })
    }
  }

  // 辅助函数
  const getTaskCountByFilter = (filter: string) => {
    if (filter === "completed") {
      return tasks.filter((task) => task.completed).length
    } else if (filter === "important") {
      return tasks.filter((task) => task.important).length
    } else if (filter === "today") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return tasks.filter((task) => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.getTime() === today.getTime()
      }).length
    } else if (filter === "overdue") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return tasks.filter((task) => {
        if (!task.dueDate || task.completed) return false
        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate < today
      }).length
    } else {
      return tasks.filter((task) => task.categoryId === filter).length
    }
  }

  // 更新日期选择处理函数，确保正确显示任务
  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date)
    if (date) {
      setActiveView("tasks")
      setActiveFilter(null) // 清除其他过滤器
      setActiveTab("all") // 重置为显示全部任务
    }
  }

  const handleSearchSuggestionClick = (suggestion: string) => {
    if (suggestion.startsWith("分类:")) {
      setSearchQuery(suggestion)
    } else {
      setSearchQuery(suggestion)
    }
    setSearchSuggestions([])
    setIsSearchFocused(false)
  }

  // 处理选项卡变化，同步UI状态
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // 如果选择了"已完成"选项卡，同步侧边栏过滤器
    if (value === "completed") {
      setActiveFilter("completed")
    }
    // 如果选择了"待办"选项卡，清除"已完成"过滤器
    else if (value === "pending") {
      if (activeFilter === "completed") {
        setActiveFilter(null)
      }
    }
    // 如果选择了"全部"选项卡，保持当前过滤器不变
    else if (value === "all") {
      if (activeFilter === "completed") {
        setActiveFilter(null)
      }
    }
  }

  // 处理侧边栏过滤器变化，同步选项卡
  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter)

    // 如果选择了"已完成"过滤器，同步选项卡
    if (filter === "completed") {
      setActiveTab("completed")
    }
    // 如果选择了"今日"过滤器，保持选项卡为"全部"
    else if (filter === "today") {
      setActiveTab("all")
    }
    // 如果清除了过滤器，重置为"全部"选项卡
    else if (filter === null) {
      setActiveTab("all")
    }
    // 其他过滤器不影响选项卡
  }

  // 生成AI助手的上下文
  const generateAIContext = () => {
    let context = "# 任务管理系统数据\n\n"

    // 添加分类信息
    context += "## 分类\n"
    categories.forEach((cat) => {
      context += `- ${cat.name} (ID: ${cat.id})\n`
    })

    // 添加任务信息
    context += "\n## 任务\n"
    tasks.forEach((task) => {
      const category = categories.find((c) => c.id === task.categoryId)
      const status = task.completed ? "✅ 已完成" : "⬜ 未完成"
      const importance = task.important ? "⭐ 重要" : ""
      const dueDate = task.dueDate ? `截止日期: ${new Date(task.dueDate).toLocaleDateString("zh-CN")}` : ""

      context += `- ${task.title} [${status}] ${importance} ${category ? `[分类: ${category.name}]` : ""} ${dueDate}\n`
      if (task.description) {
        context += `  描述: ${task.description}\n`
      }
    })

    // 添加统计信息
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.completed).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    context += "\n## 统计\n"
    context += `- 总任务数: ${totalTasks}\n`
    context += `- 已完成任务: ${completedTasks}\n`
    context += `- 完成率: ${completionRate}%\n`

    return context
  }

  // 动画变体
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

  // 颜色选择器预设颜色
  const presetColors = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#22c55e", // green
    "#ef4444", // red
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#14b8a6", // teal
    "#f97316", // orange
    "#6366f1", // indigo
  ]

  return (
    <div className={cn("container mx-auto py-8 px-4", userSettings.compactMode && "max-w-5xl")}>
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "text-2xl sm:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
              userSettings.primaryColor === "blue" && "from-blue-600 to-blue-400",
              userSettings.primaryColor === "purple" && "from-purple-600 to-purple-400",
              userSettings.primaryColor === "green" && "from-green-600 to-green-400",
              userSettings.primaryColor === "rose" && "from-rose-600 to-rose-400",
              userSettings.primaryColor === "amber" && "from-amber-600 to-amber-400",
            )}
          >
            任务流
          </motion.h1>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <ThemeToggle />
            <TaskNotifications
              tasks={tasks}
              onSelectTask={(taskId) => {
                const task = tasks.find((t) => t.id === taskId)
                if (task) {
                  setViewingTask(task)
                }
              }}
            />
            <Button
              onClick={() => setActiveView("stats")}
              variant={activeView === "stats" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
            >
              <BarChart3 className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setActiveView("calendar")}
              variant={activeView === "calendar" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
            >
              <CalendarIcon className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setActiveView("gantt")}
              variant={activeView === "gantt" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
            >
              <GanttChart className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setActiveView("timeline")}
              variant={activeView === "timeline" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
            >
              <Clock className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setActiveView("tasks")}
              variant={activeView === "tasks" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
            >
              <List className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              {viewMode === "grid" ? <List className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" /> 设置
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" /> 导出数据
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" /> 导入数据
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => setIsFormOpen(true)}
              className={cn(
                "rounded-full",
                userSettings.primaryColor === "blue" && "bg-blue-600 hover:bg-blue-700",
                userSettings.primaryColor === "purple" && "bg-purple-600 hover:bg-purple-700",
                userSettings.primaryColor === "green" && "bg-green-600 hover:bg-green-700",
                userSettings.primaryColor === "rose" && "bg-rose-600 hover:bg-rose-700",
                userSettings.primaryColor === "amber" && "bg-amber-600 hover:bg-amber-700",
              )}
            >
              <Plus className="h-5 w-5 mr-1" /> <span className="hidden sm:inline">添加任务</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={searchInputRef}
              placeholder="搜索任务或输入'分类:名称'..."
              className="pl-10 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // 延迟关闭，以便可以点击建议
                setTimeout(() => setIsSearchFocused(false), 200)
              }}
            />
            {searchQuery && isSearchFocused && searchSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-10 mt-1 w-full bg-card rounded-md shadow-lg border border-border"
              >
                <ul className="py-1">
                  {searchSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                      onClick={() => handleSearchSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <Filter className="h-4 w-4 mr-2" /> 筛选
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleFilterChange(null)}>所有任务</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("completed")}>已完成</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("important")}>重要</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("today")}>今日到期</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("overdue")}>已逾期</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={cn("lg:col-span-1 space-y-4", sidebarCollapsed && "lg:hidden")}
        >
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">筛选器</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 lg:hidden"
                onClick={() => setSidebarCollapsed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <Button
                variant={activeFilter === null && !selectedDate ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  handleFilterChange(null)
                  setSelectedDate(null)
                }}
              >
                <LayoutGrid className="h-4 w-4 mr-2" /> 所有任务
                <Badge className="ml-auto">{tasks.length}</Badge>
              </Button>
              <Button
                variant={activeFilter === "today" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  handleFilterChange("today")
                  setSelectedDate(null)
                }}
              >
                <CalendarIcon className="h-4 w-4 mr-2" /> 今日
                <Badge className="ml-auto">{getTaskCountByFilter("today")}</Badge>
              </Button>
              <Button
                variant={activeFilter === "important" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  handleFilterChange("important")
                  setSelectedDate(null)
                }}
              >
                <Star className="h-4 w-4 mr-2" /> 重要
                <Badge className="ml-auto">{getTaskCountByFilter("important")}</Badge>
              </Button>
              <Button
                variant={activeFilter === "completed" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  handleFilterChange("completed")
                  setSelectedDate(null)
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> 已完成
                <Badge className="ml-auto">{getTaskCountByFilter("completed")}</Badge>
              </Button>
              <Button
                variant={activeFilter === "overdue" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  handleFilterChange("overdue")
                  setSelectedDate(null)
                }}
              >
                <Clock className="h-4 w-4 mr-2" /> 已逾期
                <Badge className="ml-auto">{getTaskCountByFilter("overdue")}</Badge>
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">分类</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  const id = crypto.randomUUID()
                  const newCategory = {
                    id,
                    name: `新分类 ${categories.length + 1}`,
                    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                  }
                  addCategory(newCategory)
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeFilter === category.id ? "default" : "ghost"}
                  className="w-full justify-start group"
                  onClick={() => {
                    handleFilterChange(category.id)
                    setSelectedDate(null)
                  }}
                >
                  <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                  {category.name}
                  <Badge className="ml-auto">{getTaskCountByFilter(category.id)}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7 ml-1 opacity-0 group-hover:opacity-100 transition-opacity",
                          activeFilter === category.id && "text-white opacity-100",
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingCategory(category)
                          setNewCategoryName(category.name)
                          setEditingCategoryColor(category.color)
                        }}
                      >
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingCategory(category)
                        }}
                      >
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Button>
              ))}
            </div>
          </div>

          {activeView !== "calendar" && (
            <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
              <h2 className="font-semibold mb-3 text-lg">迷你日历</h2>
              <div className="p-1">
                <CalendarView tasks={tasks} onSelectDate={handleDateSelect} selectedDate={selectedDate} mini={true} />
              </div>
            </div>
          )}

          {/* AI助手按钮 */}
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 relative z-10"
              onClick={() => setIsAIOpen(!isAIOpen)}
            >
              <MessageSquare className="h-4 w-4" />
              <span>AI助手</span>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={cn("lg:col-span-3", sidebarCollapsed && "lg:col-span-4")}
        >
          {sidebarCollapsed && (
            <Button
              variant="outline"
              size="sm"
              className="mb-4 hidden lg:flex"
              onClick={() => setSidebarCollapsed(false)}
            >
              <List className="h-4 w-4 mr-2" /> 显示侧边栏
            </Button>
          )}

          {activeView === "tasks" ? (
            <>
              {selectedDate && (
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {selectedDate.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                    清除日期
                  </Button>
                </div>
              )}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="pending">待办</TabsTrigger>
                  <TabsTrigger value="completed">已完成</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-0">
                  <TaskList
                    tasks={filteredTasks}
                    viewMode={viewMode}
                    categories={categories}
                    onToggleComplete={toggleTaskCompletion}
                    onToggleImportant={toggleTaskImportance}
                    onDelete={deleteTask}
                    onUpdate={updateTask}
                    onView={(task) => setViewingTask(task)}
                    showAnimations={userSettings.showAnimations}
                  />
                </TabsContent>
                <TabsContent value="pending" className="mt-0">
                  <TaskList
                    tasks={filteredTasks.filter((task) => !task.completed)}
                    viewMode={viewMode}
                    categories={categories}
                    onToggleComplete={toggleTaskCompletion}
                    onToggleImportant={toggleTaskImportance}
                    onDelete={deleteTask}
                    onUpdate={updateTask}
                    onView={(task) => setViewingTask(task)}
                    showAnimations={userSettings.showAnimations}
                  />
                </TabsContent>
                <TabsContent value="completed" className="mt-0">
                  <TaskList
                    tasks={filteredTasks.filter((task) => task.completed)}
                    viewMode={viewMode}
                    categories={categories}
                    onToggleComplete={toggleTaskCompletion}
                    onToggleImportant={toggleTaskImportance}
                    onDelete={deleteTask}
                    onUpdate={updateTask}
                    onView={(task) => setViewingTask(task)}
                    showAnimations={userSettings.showAnimations}
                  />
                </TabsContent>
              </Tabs>
            </>
          ) : activeView === "calendar" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-6 shadow-sm border border-border"
            >
              <h2 className="text-xl font-semibold mb-4">日历视图</h2>
              <CalendarView tasks={tasks} onSelectDate={handleDateSelect} selectedDate={selectedDate} mini={false} />
            </motion.div>
          ) : activeView === "gantt" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-6 shadow-sm border border-border"
            >
              <h2 className="text-xl font-semibold mb-4">甘特图</h2>
              <GanttView
                tasks={tasks}
                categories={categories}
                onSelectTask={(taskId) => {
                  const task = tasks.find((t) => t.id === taskId)
                  if (task) {
                    setViewingTask(task)
                  }
                }}
              />
            </motion.div>
          ) : activeView === "timeline" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-6 shadow-sm border border-border"
            >
              <h2 className="text-xl font-semibold mb-4">时间轴视图</h2>
              <TimelineView
                tasks={tasks}
                categories={categories}
                onSelectTask={(taskId) => {
                  const task = tasks.find((t) => t.id === taskId)
                  if (task) {
                    setViewingTask(task)
                  }
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-6 shadow-sm border border-border"
            >
              <h2 className="text-xl font-semibold mb-4">统计分析</h2>
              <StatsView tasks={tasks} categories={categories} />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* AI助手窗口 */}
      <AnimatePresence>
        {isAIOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed z-40 right-4 bottom-4"
          >
            <Resizable
              className="border border-border bg-card shadow-lg rounded-lg overflow-hidden"
              style={{
                width: aiSize.width,
                height: aiSize.height,
              }}
              size={{
                width: aiSize.width,
                height: aiSize.height,
              }}
              minWidth={300}
              minHeight={300}
              maxWidth={"80vw"}
              maxHeight={"80vh"}
              enable={{
                top: true,
                right: true,
                bottom: true,
                left: true,
                topRight: true,
                bottomRight: true,
                bottomLeft: true,
                topLeft: true,
              }}
              onResizeStop={(e, direction, ref, d) => {
                setAiSize({
                  width: aiSize.width + d.width,
                  height: aiSize.height + d.height,
                })
              }}
            >
              <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
                <h3 className="font-medium">AI助手</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={() => setIsAIOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="h-[calc(100%-48px)]">
                <AIAssistant
                  apiKey={userSettings.openaiApiKey}
                  baseUrl={userSettings.openaiBaseUrl}
                  systemContext={generateAIContext()}
                  model={isCustomModel ? customModel : userSettings.openaiModel}
                  onExecuteCommand={handleAICommand}
                  tasks={tasks}
                  categories={categories}
                />
              </div>
            </Resizable>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl shadow-lg w-full max-w-4xl h-[90vh] border border-border overflow-hidden"
            >
              <TaskDetail
                categories={categories}
                onSubmit={addTask}
                onClose={() => setIsFormOpen(false)}
                isCreating={true}
                initialDate={selectedDate}
              />
            </motion.div>
          </motion.div>
        )}

        {/* 任务详情视图 */}
        {viewingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl shadow-lg w-full max-w-4xl h-[90vh] border border-border overflow-hidden"
            >
              <TaskDetail
                task={viewingTask}
                categories={categories}
                onSubmit={updateTask}
                onDelete={deleteTask}
                onClose={() => setViewingTask(null)}
              />
            </motion.div>
          </motion.div>
        )}

        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl shadow-lg w-full max-w-md border border-border"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">设置</h2>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsSettingsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <SettingsPanel
                  settings={userSettings}
                  onUpdateSettings={(newSettings) => {
                    setUserSettings(newSettings)
                    setIsSettingsOpen(false)
                  }}
                  onCancel={() => setIsSettingsOpen(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 分类编辑对话框 */}
      <Dialog open={editingCategory !== null} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base">分类名称</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="分类名称"
                  className="mt-2"
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-base">分类颜色</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        "border-2 hover:scale-110 transition-transform",
                        editingCategoryColor === color ? "border-border" : "border-transparent",
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingCategoryColor(color)}
                      type="button"
                    >
                      {editingCategoryColor === color && (
                        <Check className="h-4 w-4 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.5)]" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Label htmlFor="custom-color" className="text-sm">
                    自定义颜色:
                  </Label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      id="color-picker"
                      type="color"
                      value={editingCategoryColor}
                      onChange={(e) => setEditingCategoryColor(e.target.value)}
                      className="w-8 h-8 p-0 border border-border rounded-md cursor-pointer"
                    />
                    <Input
                      id="custom-color"
                      type="text"
                      value={editingCategoryColor}
                      onChange={(e) => setEditingCategoryColor(e.target.value)}
                      className="flex-1"
                      placeholder="#RRGGBB"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (editingCategory && newCategoryName.trim()) {
                  updateCategory({
                    ...editingCategory,
                    name: newCategoryName.trim(),
                    color: editingCategoryColor,
                  })
                  setEditingCategory(null)
                }
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分类删除确认对话框 */}
      <Dialog open={deletingCategory !== null} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除分类</DialogTitle>
            <DialogDescription>
              确定要删除分类 "{deletingCategory?.name}" 吗？该分类下的任务将变为无分类。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-3">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: deletingCategory?.color }} />
            <span className="font-medium">{deletingCategory?.name}</span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-muted-foreground">此操作无法撤销</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingCategory) {
                  deleteCategory(deletingCategory.id)
                }
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导出数据对话框 */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>导出数据</DialogTitle>
            <DialogDescription>导出您的所有任务、分类和设置为JSON文件</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              点击下方按钮将导出一个包含您所有数据的JSON文件。您可以使用此文件备份数据或将数据导入到其他设备。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={exportAppData}>
              <Download className="h-4 w-4 mr-2" /> 导出数据
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导入数据对话框 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>导入数据</DialogTitle>
            <DialogDescription>从JSON文件导入任务、分类和设置</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="file-upload" className="block mb-2">
                选择JSON文件
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">或者您可以直接粘贴JSON数据</p>
            </div>
            <Textarea
              placeholder="粘贴JSON数据..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={8}
              className="w-full"
            />
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-muted-foreground">导入将覆盖您当前的所有数据。请确保您已备份重要数据。</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false)
                setImportData("")
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }}
            >
              取消
            </Button>
            <Button onClick={importAppData}>
              <Upload className="h-4 w-4 mr-2" /> 导入数据
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 授权码模态框 */}
      {userSettings.authCode && !isAuthenticated && (
        <AuthCodeModal
          authCode={userSettings.authCode}
          authCodeExpiry={userSettings.authCodeExpiry || 7}
          onSuccess={() => setIsAuthenticated(true)}
        />
      )}
    </div>
  )
}

function TaskList({
  tasks,
  viewMode,
  categories,
  onToggleComplete,
  onToggleImportant,
  onDelete,
  onUpdate,
  onView,
  showAnimations = true,
}: {
  tasks: Task[]
  viewMode: "grid" | "list"
  categories: Category[]
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (task: Task) => void
  onView?: (task: Task) => void
  showAnimations?: boolean
}) {
  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="bg-muted rounded-full p-3 mb-4">
          <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-1">没有找到任务</h3>
        <p className="text-muted-foreground">添加新任务或更改筛选条件</p>
      </motion.div>
    )
  }

  // 动画变体
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
    <motion.div
      variants={showAnimations ? containerVariants : undefined}
      initial={showAnimations ? "hidden" : undefined}
      animate={showAnimations ? "visible" : undefined}
      className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}
    >
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout={showAnimations}
            variants={showAnimations ? itemVariants : undefined}
            initial={showAnimations ? { opacity: 0, y: 20 } : undefined}
            animate={showAnimations ? { opacity: 1, y: 0 } : undefined}
            exit={showAnimations ? { opacity: 0, scale: 0.9 } : undefined}
            transition={showAnimations ? { duration: 0.2 } : undefined}
          >
            <TaskItem
              task={task}
              category={categories.find((c) => c.id === task.categoryId) || null}
              onToggleComplete={() => onToggleComplete(task.id)}
              onToggleImportant={() => onToggleImportant(task.id)}
              onDelete={() => onDelete(task.id)}
              onUpdate={onUpdate}
              onView={onView ? () => onView(task) : undefined}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
