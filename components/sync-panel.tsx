"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { SyncManager, type SyncStatus, type SyncData } from "@/lib/sync-manager"
import type { Task, Category, UserSettings } from "@/lib/types"
import { Wifi, WifiOff, Users, Copy, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"

interface SyncPanelProps {
  tasks: Task[]
  categories: Category[]
  settings: UserSettings
  onDataSync: (data: SyncData) => void
}

export default function SyncPanel({ tasks, categories, settings, onDataSync }: SyncPanelProps) {
  const [syncManager] = useState(() => new SyncManager())
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("disconnected")
  const [peerId, setPeerId] = useState("")
  const [targetPeerId, setTargetPeerId] = useState("")
  const [connectionCount, setConnectionCount] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    initializeSync()
    return () => {
      syncManager.disconnect()
    }
  }, [])

  useEffect(() => {
    // 当数据变化时，广播给其他设备
    if (syncStatus === "connected" && isInitialized) {
      const syncData: SyncData = {
        tasks,
        categories,
        settings,
        timestamp: Date.now(),
        version: "1.0.0",
      }
      syncManager.broadcastData(syncData)
    }
  }, [tasks, categories, settings, syncStatus, isInitialized])

  const initializeSync = async () => {
    try {
      setSyncStatus("connecting")

      syncManager.setStatusChangeHandler((status) => {
        setSyncStatus(status)
        setConnectionCount(syncManager.getConnectionCount())

        if (status === "connected") {
          setSyncError(null)
          toast({
            title: "同步已连接",
            description: "设备间数据同步已建立",
          })
        } else if (status === "error") {
          setSyncError("连接失败")
        }
      })

      syncManager.setDataReceivedHandler((data) => {
        setSyncStatus("syncing")

        // 合并数据
        const currentData: SyncData = {
          tasks,
          categories,
          settings,
          timestamp: Date.now(),
          version: "1.0.0",
        }

        const mergedData = syncManager.mergeData(currentData, data)
        onDataSync(mergedData)
        setLastSyncTime(new Date())

        setTimeout(() => {
          setSyncStatus("connected")
        }, 1000)

        toast({
          title: "数据已同步",
          description: "从其他设备接收到最新数据",
        })
      })

      syncManager.setErrorHandler((error) => {
        setSyncError(error)
        toast({
          title: "同步错误",
          description: error,
          variant: "destructive",
        })
      })

      await syncManager.initialize()
      setPeerId(syncManager.getPeerId())
      setIsInitialized(true)
    } catch (error) {
      console.error("Failed to initialize sync:", error)
      setSyncError("初始化失败")
      setSyncStatus("error")
    }
  }

  const handleConnect = async () => {
    if (!targetPeerId.trim()) {
      toast({
        title: "请输入设备ID",
        description: "请输入要连接的设备ID",
        variant: "destructive",
      })
      return
    }

    try {
      await syncManager.connectToPeer(targetPeerId.trim())
      setTargetPeerId("")
    } catch (error) {
      toast({
        title: "连接失败",
        description: "无法连接到指定设备，请检查设备ID是否正确",
        variant: "destructive",
      })
    }
  }

  const copyPeerId = () => {
    navigator.clipboard.writeText(peerId)
    toast({
      title: "已复制",
      description: "设备ID已复制到剪贴板",
    })
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" />
      case "connecting":
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      case "syncing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (syncStatus) {
      case "connected":
        return `已连接 (${connectionCount} 设备)`
      case "connecting":
        return "连接中..."
      case "syncing":
        return "同步中..."
      case "error":
        return "连接错误"
      default:
        return "未连接"
    }
  }

  const getStatusBadgeVariant = () => {
    switch (syncStatus) {
      case "connected":
        return "default"
      case "connecting":
      case "syncing":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          {getStatusIcon()}
          {connectionCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {connectionCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            设备同步
          </DialogTitle>
          <DialogDescription>在多个设备之间同步您的任务和数据</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 状态显示 */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium">{getStatusText()}</span>
                </div>
                <Badge variant={getStatusBadgeVariant()}>{syncStatus === "connected" ? "在线" : "离线"}</Badge>
              </div>

              {lastSyncTime && (
                <p className="text-xs text-muted-foreground mt-2">最后同步: {lastSyncTime.toLocaleString()}</p>
              )}

              {syncError && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {syncError}
                </p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="connect" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="connect">连接设备</TabsTrigger>
              <TabsTrigger value="share">分享设备</TabsTrigger>
            </TabsList>

            <TabsContent value="connect" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="peer-id">输入设备ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="peer-id"
                    placeholder="输入要连接的设备ID"
                    value={targetPeerId}
                    onChange={(e) => setTargetPeerId(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleConnect()}
                  />
                  <Button onClick={handleConnect} disabled={syncStatus === "connecting" || !targetPeerId.trim()}>
                    连接
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>• 输入其他设备的ID来建立连接</p>
                <p>• 连接后数据将自动同步</p>
                <p>• 支持多设备同时连接</p>
              </div>
            </TabsContent>

            <TabsContent value="share" className="space-y-4">
              <div className="space-y-2">
                <Label>您的设备ID</Label>
                <div className="flex gap-2">
                  <Input value={peerId} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copyPeerId} disabled={!peerId}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>• 将此ID分享给其他设备</p>
                <p>• 其他设备可以使用此ID连接到您</p>
                <p>• ID在每次启动时会重新生成</p>
              </div>
            </TabsContent>
          </Tabs>

          {/* 连接的设备列表 */}
          {connectionCount > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">已连接设备</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{connectionCount} 个设备已连接</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 重新连接按钮 */}
          {syncStatus === "error" && (
            <Button onClick={initializeSync} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              重新连接
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
