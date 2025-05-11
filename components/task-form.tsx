"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon, Check, X, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task, Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

interface TaskFormProps {
  task?: Task
  onSubmit: (task: Task) => void
  onCancel: () => void
  categories: Category[]
  initialDate?: Date | null
}

export default function TaskForm({ task, onSubmit, onCancel, categories, initialDate }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [categoryId, setCategoryId] = useState<string | null>(task?.categoryId || null)
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : initialDate || undefined,
  )
  const [important, setImportant] = useState(task?.important || false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  // 当按下Escape键时退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const newTask: Task = {
      id: task?.id || crypto.randomUUID(),
      title,
      description,
      categoryId: categoryId,
      completed: task?.completed || false,
      important,
      dueDate: dueDate ? dueDate.toISOString() : null,
      createdAt: task?.createdAt || new Date().toISOString(),
    }

    onSubmit(newTask)
  }

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : "",
      )}
    >
      <form onSubmit={handleSubmit} className={cn("space-y-4", isFullscreen && "max-w-4xl mx-auto pt-10")}>
        <div className="flex items-center justify-between">
          <Input
            placeholder="任务标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={cn("text-lg font-medium border-none shadow-none px-0 text-2xl", isFullscreen ? "text-3xl" : "")}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-full"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            {isFullscreen && (
              <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">分类</label>
            <Select
              value={categoryId || "none"}
              onValueChange={(value) => setCategoryId(value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">截止日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP", { locale: zhCN }) : "设置截止日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} locale={zhCN} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "gap-1 rounded-full",
              important &&
                "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-500",
            )}
            onClick={() => setImportant(!important)}
          >
            {important && <Check className="h-3.5 w-3.5" />}
            标记为重要
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? "编辑" : "预览"}
            </Button>
          </div>
        </div>

        {isPreview ? (
          <div className="min-h-[200px] border rounded-md p-4 prose prose-sm dark:prose-invert max-w-none">
            {description ? (
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {description}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">无描述内容</p>
            )}
          </div>
        ) : (
          <Textarea
            placeholder="描述（支持Markdown格式）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={isFullscreen ? 15 : 6}
            className="min-h-[200px] font-mono text-sm"
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          {!isFullscreen && (
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit">{task ? "更新任务" : "添加任务"}</Button>
        </div>
      </form>
    </div>
  )
}
