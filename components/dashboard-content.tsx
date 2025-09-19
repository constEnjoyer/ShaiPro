"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, CheckCircle, TrendingUp, Users, Mic, Play, Zap, Target } from "lucide-react"
import { useState, useEffect } from "react"

export function DashboardContent() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [meetingUrl, setMeetingUrl] = useState("")
  const [jiraTasks, setJiraTasks] = useState([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)

  useEffect(() => {
    loadJiraTasks()
  }, [])

  const loadJiraTasks = async () => {
    try {
      const response = await fetch("/api/jira/tasks")
      const data = await response.json()
      if (data.success) {
        setJiraTasks(data.tasks.slice(0, 3)) // Show only 3 recent tasks
      }
    } catch (error) {
      console.error("Failed to load Jira tasks:", error)
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const handleConnectMeeting = async () => {
    if (!meetingUrl.trim()) {
      alert("Пожалуйста, введите URL встречи Zoom")
      return
    }

    setIsConnecting(true)
    try {
      const response = await fetch("/api/zoom/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meetingUrl }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Встреча успешно подключена! ИИ-агент начал запись и анализ.")
        setMeetingUrl("")
        // Reload tasks after successful connection
        loadJiraTasks()
      } else {
        alert(`Ошибка подключения: ${data.error}`)
      }
    } catch (error) {
      alert("Ошибка подключения к встрече. Проверьте URL и попробуйте снова.")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Добро пожаловать в AI Meeting Agent!</h1>
          <p className="text-muted-foreground">Автоматизируйте создание задач из ваших встреч Zoom/Meet в Jira</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Введите URL встречи Zoom"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            className="w-64"
          />
          <Button className="bg-primary hover:bg-primary/90" onClick={handleConnectMeeting} disabled={isConnecting}>
            <Mic className="w-4 h-4 mr-2" />
            {isConnecting ? "Подключение..." : "Подключить встречу"}
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">ИИ-агент готов к работе</h3>
              <p className="text-sm text-muted-foreground">
                Подключения к Zoom активны. Jira интеграция настроена. Gemini 1.5 Flash готов анализировать речь и
                создавать задачи.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Встреч обработано</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">47</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+23%</span> за неделю
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Задач создано</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">156</div>
            <p className="text-xs text-muted-foreground">Автоматически в Jira</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Точность распознавания</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">94%</div>
            <p className="text-xs text-muted-foreground">WER показатель</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">28</div>
            <p className="text-xs text-muted-foreground">В команде</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Последние встречи
            </CardTitle>
            <CardDescription>Недавно обработанные встречи и их статус</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Daily Standup - Проект BFinance", time: "30 минут назад", status: "processed", tasks: 3 },
              { title: "Планирование спринта BFinance Q4", time: "2 часа назад", status: "processing", tasks: 0 },
              { title: "Ретроспектива запуска BFinance", time: "1 день назад", status: "processed", tasks: 7 },
            ].map((meeting, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Play className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{meeting.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {meeting.time} • {meeting.tasks > 0 ? `${meeting.tasks} задач создано` : "Обрабатывается"}
                    </p>
                  </div>
                </div>
                <Badge variant={meeting.status === "processed" ? "default" : "secondary"}>
                  {meeting.status === "processed" ? "Готово" : "В процессе"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Недавние задачи в Jira
            </CardTitle>
            <CardDescription>Задачи, автоматически созданные из встреч</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingTasks ? (
              <div className="text-center text-muted-foreground">Загрузка задач...</div>
            ) : jiraTasks.length > 0 ? (
              jiraTasks.map((task: any, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm text-foreground">{task.fields?.summary || "Без названия"}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.key} • Исполнитель: {task.fields?.assignee?.displayName || "Не назначен"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      task.fields?.priority?.name === "High"
                        ? "destructive"
                        : task.fields?.priority?.name === "Medium"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {task.fields?.priority?.name === "High"
                      ? "Высокий"
                      : task.fields?.priority?.name === "Medium"
                        ? "Средний"
                        : "Низкий"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">Задачи не найдены</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
