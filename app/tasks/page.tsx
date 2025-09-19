"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare, Clock, User, ExternalLink, Plus, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
  })

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const response = await fetch("/api/jira/tasks")
      const data = await response.json()
      if (data.success) {
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error("Failed to load tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createTask = async () => {
    if (!newTask.title.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/jira/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      })

      const data = await response.json()
      if (data.success) {
        setNewTask({ title: "", description: "", priority: "Medium" })
        setShowCreateForm(false)
        loadTasks() // Reload tasks
        alert("Задача успешно создана в Jira!")
      } else {
        alert(`Ошибка создания задачи: ${data.error}`)
      }
    } catch (error) {
      alert("Ошибка создания задачи")
    } finally {
      setIsCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || ""
    if (statusLower.includes("done") || statusLower.includes("готово")) {
      return "bg-green-100 text-green-800"
    } else if (statusLower.includes("progress") || statusLower.includes("работе")) {
      return "bg-blue-100 text-blue-800"
    } else {
      return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority?.toLowerCase() || ""
    if (priorityLower.includes("highest") || priorityLower.includes("critical")) {
      return "bg-red-100 text-red-800"
    } else if (priorityLower.includes("high")) {
      return "bg-orange-100 text-orange-800"
    } else if (priorityLower.includes("medium")) {
      return "bg-yellow-100 text-yellow-800"
    } else {
      return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Задачи</h1>
              <p className="text-muted-foreground">
                Задачи, автоматически созданные из встреч и синхронизированные с Jira
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Создать задачу
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Создать новую задачу</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Название задачи"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Textarea
                  placeholder="Описание задачи"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
                <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Низкий</SelectItem>
                    <SelectItem value="Medium">Средний</SelectItem>
                    <SelectItem value="High">Высокий</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={createTask} disabled={isCreating}>
                    {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Создать в Jira
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Загрузка задач из Jira...</p>
              </div>
            ) : tasks.length > 0 ? (
              tasks.map((task: any) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <CheckSquare className="w-5 h-5 text-primary" />
                          {task.fields?.summary || "Без названия"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {task.fields?.description?.content?.[0]?.content?.[0]?.text || "Описание отсутствует"}
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://zhigazh2017.atlassian.net/browse/${task.key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Jira
                        </a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(task.fields?.status?.name)}>
                          {task.fields?.status?.name || "Неизвестно"}
                        </Badge>
                        <Badge className={getPriorityColor(task.fields?.priority?.name)}>
                          {task.fields?.priority?.name || "Средний"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {task.fields?.assignee?.displayName || "Не назначен"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {task.key}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Задачи не найдены</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
