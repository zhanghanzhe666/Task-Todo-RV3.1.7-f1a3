import type { Task, Category, UserSettings } from "./types"

export interface SyncData {
  tasks: Task[]
  categories: Category[]
  settings: UserSettings
  timestamp: number
  version: string
}

export interface SyncMessage {
  type: "sync_request" | "sync_response" | "data_update" | "ping" | "pong"
  data?: SyncData
  timestamp: number
  senderId: string
}

export type SyncStatus = "disconnected" | "connecting" | "connected" | "syncing" | "error"

export class SyncManager {
  private peer: any = null
  private connections: Map<string, any> = new Map()
  private peerId = ""
  private isHost = false
  private onStatusChange?: (status: SyncStatus) => void
  private onDataReceived?: (data: SyncData) => void
  private onError?: (error: string) => void
  private heartbeatInterval?: NodeJS.Timeout
  private reconnectTimeout?: NodeJS.Timeout
  private maxReconnectAttempts = 5
  private reconnectAttempts = 0

  constructor() {
    this.peerId = this.generatePeerId()
  }

  private generatePeerId(): string {
    return `taskflow-${Math.random().toString(36).substr(2, 9)}`
  }

  async initialize(): Promise<void> {
    try {
      // 动态导入 PeerJS
      const { default: Peer } = await import("peerjs")

      // 使用本地 STUN 服务器，不依赖外部服务器
      this.peer = new Peer(this.peerId, {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
          ],
          sdpSemantics: "unified-plan",
        },
        debug: 1, // 减少日志输出
      })

      this.setupPeerEvents()
    } catch (error) {
      console.error("Failed to initialize PeerJS:", error)
      this.onError?.("无法初始化同步服务")
    }
  }

  private setupPeerEvents(): void {
    if (!this.peer) return

    this.peer.on("open", (id: string) => {
      console.log("Peer connected with ID:", id)
      this.peerId = id
      this.onStatusChange?.("connected")
      this.startHeartbeat()
    })

    this.peer.on("connection", (conn: any) => {
      this.handleIncomingConnection(conn)
    })

    this.peer.on("error", (error: any) => {
      console.error("Peer error:", error)

      // 处理特定错误类型
      if (error.type === "network" || error.type === "server-error" || error.message.includes("Lost connection")) {
        this.onError?.(`连接错误: 服务器连接丢失，尝试使用本地连接`)
        // 尝试使用本地连接模式
        this.switchToLocalMode()
      } else {
        this.onError?.(`连接错误: ${error.message}`)
        this.handleDisconnection()
      }
    })

    this.peer.on("disconnected", () => {
      console.log("Peer disconnected")
      this.handleDisconnection()
    })
  }

  // 切换到本地连接模式
  private switchToLocalMode(): void {
    if (this.peer) {
      this.peer.destroy()
    }

    setTimeout(async () => {
      try {
        const { default: Peer } = await import("peerjs")

        // 使用本地模式，不依赖信令服务器
        this.peer = new Peer(this.peerId, {
          config: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
          },
          host: "localhost",
          port: 9000,
          path: "/myapp",
        })

        this.setupPeerEvents()
        this.onStatusChange?.("connecting")
      } catch (error) {
        console.error("Failed to switch to local mode:", error)
        this.onError?.("无法切换到本地连接模式")
      }
    }, 1000)
  }

  private handleIncomingConnection(conn: any): void {
    console.log("Incoming connection from:", conn.peer)
    this.setupConnection(conn)
    this.connections.set(conn.peer, conn)

    // 如果是第一个连接，成为主机
    if (this.connections.size === 1) {
      this.isHost = true
    }
  }

  private setupConnection(conn: any): void {
    conn.on("open", () => {
      console.log("Connection opened with:", conn.peer)
      this.onStatusChange?.("connected")
    })

    conn.on("data", (message: SyncMessage) => {
      this.handleMessage(message, conn)
    })

    conn.on("close", () => {
      console.log("Connection closed with:", conn.peer)
      this.connections.delete(conn.peer)
      if (this.connections.size === 0) {
        this.onStatusChange?.("disconnected")
      }
    })

    conn.on("error", (error: any) => {
      console.error("Connection error with", conn.peer, ":", error)
      this.connections.delete(conn.peer)
    })
  }

  private handleMessage(message: SyncMessage, conn: any): void {
    switch (message.type) {
      case "sync_request":
        // 发送当前数据作为响应
        if (this.isHost) {
          this.sendSyncResponse(conn)
        }
        break

      case "sync_response":
      case "data_update":
        if (message.data) {
          this.onDataReceived?.(message.data)
        }
        break

      case "ping":
        this.sendMessage(conn, { type: "pong", timestamp: Date.now(), senderId: this.peerId })
        break

      case "pong":
        // 心跳响应，连接正常
        break
    }
  }

  private sendMessage(conn: any, message: SyncMessage): void {
    try {
      if (conn.open) {
        conn.send(message)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  private sendSyncResponse(conn: any): void {
    // 这里需要从外部获取当前数据
    // 实际实现中，这个方法会接收当前的任务和分类数据
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((conn) => {
        this.sendMessage(conn, {
          type: "ping",
          timestamp: Date.now(),
          senderId: this.peerId,
        })
      })
    }, 30000) // 每30秒发送一次心跳
  }

  private handleDisconnection(): void {
    this.onStatusChange?.("disconnected")
    this.reconnectAttempts++

    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      this.reconnectTimeout = setTimeout(
        () => {
          this.reconnect()
        },
        Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000),
      )
    }
  }

  private async reconnect(): Promise<void> {
    try {
      this.onStatusChange?.("connecting")
      await this.initialize()
      this.reconnectAttempts = 0
    } catch (error) {
      console.error("Reconnection failed:", error)
      this.handleDisconnection()
    }
  }

  async connectToPeer(targetPeerId: string): Promise<void> {
    if (!this.peer) {
      throw new Error("Peer not initialized")
    }

    try {
      this.onStatusChange?.("connecting")
      const conn = this.peer.connect(targetPeerId, {
        reliable: true,
        serialization: "json",
      })

      this.setupConnection(conn)
      this.connections.set(targetPeerId, conn)

      // 连接建立后请求同步数据
      conn.on("open", () => {
        this.sendMessage(conn, {
          type: "sync_request",
          timestamp: Date.now(),
          senderId: this.peerId,
        })
      })
    } catch (error) {
      console.error("Failed to connect to peer:", error)
      this.onError?.("无法连接到指定设备")
      this.onStatusChange?.("error")
    }
  }

  broadcastData(data: SyncData): void {
    const message: SyncMessage = {
      type: "data_update",
      data,
      timestamp: Date.now(),
      senderId: this.peerId,
    }

    this.connections.forEach((conn) => {
      this.sendMessage(conn, message)
    })
  }

  setStatusChangeHandler(handler: (status: SyncStatus) => void): void {
    this.onStatusChange = handler
  }

  setDataReceivedHandler(handler: (data: SyncData) => void): void {
    this.onDataReceived = handler
  }

  setErrorHandler(handler: (error: string) => void): void {
    this.onError = handler
  }

  getPeerId(): string {
    return this.peerId
  }

  getConnectionCount(): number {
    return this.connections.size
  }

  isConnected(): boolean {
    return this.connections.size > 0
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.connections.forEach((conn) => {
      conn.close()
    })
    this.connections.clear()

    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }

    this.onStatusChange?.("disconnected")
  }

  // 数据冲突解决：使用时间戳和合并策略
  mergeData(localData: SyncData, remoteData: SyncData): SyncData {
    const mergedTasks = this.mergeTasks(localData.tasks, remoteData.tasks)
    const mergedCategories = this.mergeCategories(localData.categories, remoteData.categories)

    return {
      tasks: mergedTasks,
      categories: mergedCategories,
      settings: localData.timestamp > remoteData.timestamp ? localData.settings : remoteData.settings,
      timestamp: Math.max(localData.timestamp, remoteData.timestamp),
      version: localData.version,
    }
  }

  private mergeTasks(localTasks: Task[], remoteTasks: Task[]): Task[] {
    const taskMap = new Map<string, Task>()

    // 添加本地任务
    localTasks.forEach((task) => {
      taskMap.set(task.id, task)
    })

    // 合并远程任务（如果远程任务更新，则覆盖本地任务）
    remoteTasks.forEach((remoteTask) => {
      const localTask = taskMap.get(remoteTask.id)
      if (!localTask || new Date(remoteTask.createdAt) > new Date(localTask.createdAt)) {
        taskMap.set(remoteTask.id, remoteTask)
      }
    })

    return Array.from(taskMap.values())
  }

  private mergeCategories(localCategories: Category[], remoteCategories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>()

    // 添加本地分类
    localCategories.forEach((category) => {
      categoryMap.set(category.id, category)
    })

    // 合并远程分类
    remoteCategories.forEach((remoteCategory) => {
      if (!categoryMap.has(remoteCategory.id)) {
        categoryMap.set(remoteCategory.id, remoteCategory)
      }
    })

    return Array.from(categoryMap.values())
  }
}
