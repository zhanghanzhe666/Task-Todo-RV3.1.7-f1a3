import type { Metadata } from "next"
import TaskDashboard from "@/components/task-dashboard"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "任务流 - 现代任务管理",
  description: "一个设计精美的任务管理应用",
}

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-background">
        <TaskDashboard />
        <Toaster />
      </div>
    </ThemeProvider>
  )
}
