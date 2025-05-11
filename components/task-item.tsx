"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Circle, MoreHorizontal, Star, Trash2, Tag, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Task, Category } from "@/lib/types"
import { cn } from "@/lib/utils"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface TaskItemProps {
  task: Task
  category: Category | null
  onToggleComplete: () => void
  onToggleImportant: () => void
  onDelete: () => void
  onUpdate: (task: Task) => void
  onEdit?: () => void
  onView?: () => void
}

export default function TaskItem({
  task,
  category,
  onToggleComplete,
  onToggleImportant,
  onDelete,
  onUpdate,
  onEdit,
  onView,
}: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const isOverdue = () => {
    if (!task.dueDate) return false
    const now = new Date()
    const dueDate = new Date(task.dueDate)
    return !task.completed && dueDate < now
  }

  // 判断描述是否足够长，需要预览按钮
  const hasDescription = task.description && task.description.trim().length > 0

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all border-l-4 group hover:shadow-md cursor-pointer task-card-hover",
          task.completed
            ? "opacity-80 border-l-green-500"
            : task.important
              ? "border-l-amber-500"
              : isOverdue()
                ? "border-l-red-500"
                : "border-l-transparent",
          isHovered && "ring-1 ring-primary/20",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          // 只有当点击的不是按钮或其子元素时才触发查看
          if (!e.defaultPrevented && !e.target.closest("button") && !e.target.closest('[role="menuitem"]')) {
            onView && onView()
          }
        }}
      >
        <CardContent className="p-0">
          <div className="flex items-start p-4 gap-3">
            <motion.div
              whileTap={{ scale: 0.9 }}
              initial={{ scale: 1 }}
              animate={{ scale: 1 }}
              className="relative z-10"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full h-6 w-6 shrink-0 mt-0.5",
                  task.completed ? "text-green-500" : "text-muted-foreground",
                  "transition-colors duration-300",
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleComplete()
                }}
              >
                {task.completed ? (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </Button>
              {isHovered && !task.completed && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 1.5,
                    ease: "easeOut",
                  }}
                  style={{
                    border: "1px solid rgba(var(--primary-rgb), 0.3)",
                  }}
                />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={cn(
                    "font-medium line-clamp-2 transition-all duration-300 font-serif",
                    task.completed && "line-through text-muted-foreground",
                  )}
                >
                  {task.title}
                </h3>
                <div className="flex items-center shrink-0">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleImportant()
                      }}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-all duration-300",
                          task.important ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                        )}
                      />
                    </Button>
                  </motion.div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete()
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> 删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {hasDescription && (
                <div
                  className={cn(
                    "text-sm text-muted-foreground mt-1 line-clamp-2 transition-all duration-300",
                    task.completed && "line-through",
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm dark:prose-invert max-w-none"
                    components={{
                      p: ({ node, ...props }) => <p className="line-clamp-2 m-0" {...props} />,
                    }}
                  >
                    {task.description}
                  </ReactMarkdown>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {category && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Badge
                      variant="outline"
                      className="rounded-full border-border flex items-center gap-1"
                      style={{
                        borderColor: `${category.color}40`,
                        backgroundColor: `${category.color}10`,
                      }}
                    >
                      <Tag className="h-3 w-3 mr-0.5" />
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.name}
                    </Badge>
                  </motion.div>
                )}

                {task.dueDate && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full flex items-center gap-1",
                        isOverdue() && "border-destructive text-destructive",
                      )}
                    >
                      <Calendar className="h-3 w-3 mr-0.5" />
                      {formatDate(task.dueDate)}
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
