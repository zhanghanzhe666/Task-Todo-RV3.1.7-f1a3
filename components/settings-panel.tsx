"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { UserSettings } from "@/lib/types"

interface SettingsPanelProps {
  settings: UserSettings
  onUpdateSettings: (settings: UserSettings) => void
  onCancel: () => void
}

export default function SettingsPanel({ settings, onUpdateSettings, onCancel }: SettingsPanelProps) {
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor)
  const [compactMode, setCompactMode] = useState(settings.compactMode)
  const [showAnimations, setShowAnimations] = useState(settings.showAnimations)
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey)
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(settings.openaiBaseUrl)
  const [isCustomModel, setIsCustomModel] = useState(
    ![
      "gpt-3.5-turbo",
      "gpt-4",
      "gpt-4-turbo",
      "gpt-4o",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ].includes(settings.openaiModel),
  )
  const [openaiModel, setOpenaiModel] = useState(settings.openaiModel)
  const [customModel, setCustomModel] = useState(isCustomModel ? settings.openaiModel : "")
  const [authCode, setAuthCode] = useState(settings.authCode || "")
  const [authCodeExpiry, setAuthCodeExpiry] = useState(settings.authCodeExpiry || 168) // 默认7天 = 168小时

  const handleSave = () => {
    onUpdateSettings({
      ...settings,
      primaryColor,
      compactMode,
      showAnimations,
      openaiApiKey,
      openaiBaseUrl,
      openaiModel: isCustomModel ? customModel : openaiModel,
      authCode,
      authCodeExpiry,
    })
  }

  return (
    <Tabs defaultValue="appearance" className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="appearance">外观</TabsTrigger>
        <TabsTrigger value="behavior">行为</TabsTrigger>
        <TabsTrigger value="ai">AI 设置</TabsTrigger>
        <TabsTrigger value="security">安全</TabsTrigger>
      </TabsList>

      <TabsContent value="appearance" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>主题颜色</Label>
            <div className="grid grid-cols-5 gap-2">
              <ColorButton color="blue" selected={primaryColor === "blue"} onClick={() => setPrimaryColor("blue")} />
              <ColorButton
                color="purple"
                selected={primaryColor === "purple"}
                onClick={() => setPrimaryColor("purple")}
              />
              <ColorButton color="green" selected={primaryColor === "green"} onClick={() => setPrimaryColor("green")} />
              <ColorButton color="rose" selected={primaryColor === "rose"} onClick={() => setPrimaryColor("rose")} />
              <ColorButton color="amber" selected={primaryColor === "amber"} onClick={() => setPrimaryColor("amber")} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="compact-mode" className="cursor-pointer">
              紧凑模式
            </Label>
            <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-animations" className="cursor-pointer">
              显示动画
            </Label>
            <Switch id="show-animations" checked={showAnimations} onCheckedChange={setShowAnimations} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="behavior" className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sidebar-collapsed" className="cursor-pointer">
              默认折叠侧边栏
            </Label>
            <Switch
              id="sidebar-collapsed"
              checked={settings.sidebarCollapsed}
              onCheckedChange={(checked) => {
                onUpdateSettings({
                  ...settings,
                  sidebarCollapsed: checked,
                })
              }}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="ai" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-api-key">OpenAI API 密钥</Label>
            <Input
              id="openai-api-key"
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-base-url">API 基础 URL</Label>
            <Input
              id="openai-base-url"
              value={openaiBaseUrl}
              onChange={(e) => setOpenaiBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="space-y-2">
            <Label>模型选择</Label>
            <RadioGroup
              value={isCustomModel ? "custom" : "preset"}
              onValueChange={(value) => setIsCustomModel(value === "custom")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="preset" id="preset" />
                <Label htmlFor="preset">预设模型</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">自定义模型</Label>
              </div>
            </RadioGroup>
          </div>

          {isCustomModel ? (
            <div className="space-y-2">
              <Label htmlFor="custom-model">自定义模型名称</Label>
              <Input
                id="custom-model"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="输入模型名称..."
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="openai-model">选择模型</Label>
              <select
                id="openai-model"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="w-full p-2 rounded-md border border-input bg-background"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
              </select>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="security" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-code">授权码</Label>
            <Input
              id="auth-code"
              type="password"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="设置访问授权码"
            />
            <p className="text-xs text-muted-foreground">
              设置授权码后，访问应用需要输入此授权码。留空则不需要授权码。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-code-expiry">授权码有效期（小时）</Label>
            <Input
              id="auth-code-expiry"
              type="number"
              min="1"
              max="8760" // 最多一年 (365*24)
              value={authCodeExpiry}
              onChange={(e) => setAuthCodeExpiry(Number.parseInt(e.target.value) || 168)}
            />
            <p className="text-xs text-muted-foreground">设置授权码在浏览器中的有效期，过期后需要重新输入。</p>
          </div>
        </div>
      </TabsContent>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={handleSave}>保存设置</Button>
      </div>
    </Tabs>
  )
}

function ColorButton({
  color,
  selected,
  onClick,
}: {
  color: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`w-full h-10 rounded-md transition-all ${
        selected ? "ring-2 ring-offset-2 ring-offset-background" : ""
      }`}
      style={{
        backgroundColor: getColorValue(color),
        ringColor: getColorValue(color),
      }}
      onClick={onClick}
      type="button"
      aria-label={`选择${color}颜色`}
    />
  )
}

function getColorValue(color: string): string {
  switch (color) {
    case "blue":
      return "#3b82f6"
    case "purple":
      return "#8b5cf6"
    case "green":
      return "#22c55e"
    case "rose":
      return "#f43f5e"
    case "amber":
      return "#f59e0b"
    default:
      return "#3b82f6"
  }
}
