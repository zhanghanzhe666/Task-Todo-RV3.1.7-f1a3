export interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  important: boolean
  categoryId: string | null
  dueDate: string | null
  createdAt: string
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface UserSettings {
  primaryColor: string
  compactMode: boolean
  showAnimations: boolean
  defaultView: string
  sidebarCollapsed: boolean
  openaiApiKey: string
  openaiBaseUrl: string
  openaiModel: string
  authCode?: string
  authCodeExpiry?: number // 以小时为单位
}

// 导出/导入数据的接口
export interface AppData {
  tasks: Task[]
  categories: Category[]
  settings: UserSettings
  version: string
}
