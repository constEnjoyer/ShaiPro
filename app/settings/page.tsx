"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Sidebar } from "@/components/sidebar"
import { Zap, Link, Bell, Target, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const [jiraTestStatus, setJiraTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [jiraTestMessage, setJiraTestMessage] = useState("")
  const [availableProjects, setAvailableProjects] = useState<any[]>([])

  const testJiraConnection = async () => {
    setJiraTestStatus("testing")
    setJiraTestMessage("")

    try {
      // Test projects endpoint first
      const projectsResponse = await fetch("/api/jira/projects")
      const projectsData = await projectsResponse.json()

      if (projectsData.success) {
        setAvailableProjects(projectsData.projects)

        // Test tasks endpoint
        const tasksResponse = await fetch("/api/jira/tasks")
        const tasksData = await tasksResponse.json()

        if (tasksData.success) {
          setJiraTestStatus("success")
          setJiraTestMessage(
            `✅ Подключение успешно! Найдено проектов: ${projectsData.projects.length}, задач: ${tasksData.tasks.length}`,
          )
        } else {
          setJiraTestStatus("error")
          setJiraTestMessage(`❌ Ошибка получения задач: ${tasksData.error}`)
        }
      } else {
        setJiraTestStatus("error")
        setJiraTestMessage(`❌ Ошибка подключения: ${projectsData.error}`)
      }
    } catch (error) {
      setJiraTestStatus("error")
      setJiraTestMessage(`❌ Ошибка сети: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Настройки</h1>
            <p className="text-muted-foreground">Конфигурация ИИ-агента и интеграций</p>
          </div>

          {/* Zoom/Meet Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Интеграция с видеоконференциями
              </CardTitle>
              <CardDescription>Настройка подключения к Zoom и Google Meet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zoom-api">Zoom API Key</Label>
                  <Input id="zoom-api" placeholder="Введите API ключ Zoom" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zoom-secret">Zoom API Secret</Label>
                  <Input id="zoom-secret" placeholder="Введите API секрет" type="password" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meet-credentials">Google Meet Credentials</Label>
                  <Input id="meet-credentials" placeholder="Путь к JSON файлу" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input id="webhook-url" placeholder="https://your-domain.com/webhook" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="auto-join" />
                <Label htmlFor="auto-join">Автоматически подключаться к запланированным встречам</Label>
              </div>
            </CardContent>
          </Card>

          {/* Jira Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Интеграция с Jira
              </CardTitle>
              <CardDescription>Настройка автоматического создания задач</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jira-url">Jira URL</Label>
                  <Input
                    id="jira-url"
                    placeholder="https://your-company.atlassian.net"
                    defaultValue="https://otsosinzhiger.atlassian.net"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jira-email">Email пользователя</Label>
                  <Input id="jira-email" placeholder="user@company.com" defaultValue="otsosinzhiger@gmail.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jira-token">API Token</Label>
                  <Input id="jira-token" placeholder="Введите API токен" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-project">Проект по умолчанию</Label>
                  <Input id="default-project" placeholder="PROJECT-KEY" />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Проверка подключения</Label>
                  <Button
                    onClick={testJiraConnection}
                    disabled={jiraTestStatus === "testing"}
                    variant="outline"
                    size="sm"
                  >
                    {jiraTestStatus === "testing" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {jiraTestStatus === "success" && <CheckCircle className="w-4 h-4 mr-2 text-green-500" />}
                    {jiraTestStatus === "error" && <XCircle className="w-4 h-4 mr-2 text-red-500" />}
                    Проверить подключение
                  </Button>
                </div>

                {jiraTestMessage && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      jiraTestStatus === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : jiraTestStatus === "error"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                    }`}
                  >
                    {jiraTestMessage}
                  </div>
                )}

                {availableProjects.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-sm font-medium">Доступные проекты:</Label>
                    <div className="mt-2 space-y-1">
                      {availableProjects.map((project) => (
                        <div key={project.key} className="text-sm text-muted-foreground">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">{project.key}</span> -{" "}
                          {project.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-assign" />
                  <Label htmlFor="auto-assign">Автоматически назначать исполнителей на основе упоминаний</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="priority-detection" />
                  <Label htmlFor="priority-detection">Определять приоритет задач из контекста</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Настройки ИИ
              </CardTitle>
              <CardDescription>Конфигурация алгоритмов распознавания и анализа</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Основной язык</Label>
                  <select className="w-full p-2 border rounded-md" id="language">
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                    <option value="auto">Автоопределение</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidence">Минимальная уверенность (%)</Label>
                  <Input id="confidence" type="number" placeholder="85" min="50" max="100" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch id="speaker-detection" defaultChecked />
                  <Label htmlFor="speaker-detection">Определение говорящих</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="emotion-analysis" />
                  <Label htmlFor="emotion-analysis">Анализ эмоциональной окраски</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="keyword-extraction" defaultChecked />
                  <Label htmlFor="keyword-extraction">Извлечение ключевых слов</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Уведомления
              </CardTitle>
              <CardDescription>Настройка оповещений о работе системы</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch id="meeting-start" defaultChecked />
                  <Label htmlFor="meeting-start">Уведомлять о начале записи встречи</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="task-created" defaultChecked />
                  <Label htmlFor="task-created">Уведомлять о создании новых задач в Jira</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="processing-complete" />
                  <Label htmlFor="processing-complete">Уведомлять о завершении обработки встречи</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="error-alerts" defaultChecked />
                  <Label htmlFor="error-alerts">Уведомлять об ошибках системы</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notification-email">Email для уведомлений</Label>
                <Input id="notification-email" placeholder="admin@company.com" type="email" />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90">Сохранить настройки</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
