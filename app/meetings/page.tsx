"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/sidebar"
import {
  Calendar,
  Clock,
  Users,
  Mic,
  Play,
  Search,
  Filter,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { VoiceRecorder } from "@/components/voice-recorder"
import { ScheduledMeetingForm } from "@/components/scheduled-meeting-form"
import { ScreenCapture } from "@/components/screen-capture"

export default function MeetingsPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [meetingUrl, setMeetingUrl] = useState("")
  const [meetings, setMeetings] = useState([])
  const [scheduledMeetings, setScheduledMeetings] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleConnectNewMeeting = async () => {
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
        alert("Новая встреча успешно подключена! ИИ-агент готов к записи.")
        setMeetingUrl("")
        // Add the new meeting to the list
        const newMeeting = {
          title: data.meeting?.topic || "Новая встреча",
          date: new Date().toLocaleString("ru-RU"),
          duration: "В процессе",
          participants: data.meeting?.participants || 0,
          status: "processing",
          tasksCreated: 0,
          transcriptAvailable: false,
        }
        setMeetings((prev) => [newMeeting, ...prev])
      } else {
        alert(`Ошибка подключения: ${data.error}`)
      }
    } catch (error) {
      alert("Ошибка подключения к новой встрече. Проверьте настройки.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleScheduleMeeting = (meeting: any) => {
    setScheduledMeetings((prev) => [meeting, ...prev])
    alert(`Встреча "${meeting.title}" запланирована на ${meeting.date} в ${meeting.time}`)
  }

  const downloadTranscript = async (meetingId: string) => {
    try {
      // This would typically fetch the transcript from your API
      const transcript = `Транскрипт встречи ${meetingId}\n\nВремя: ${new Date().toLocaleString("ru-RU")}\n\n[Содержимое транскрипта будет здесь после обработки ИИ]`

      const blob = new Blob([transcript], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transcript-${meetingId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert("Ошибка скачивания транскрипта")
    }
  }

  const handleTasksCreated = (tasks: any[]) => {
    console.log("[v0] Tasks created from voice recording:", tasks)
    // Refresh meetings list or show notification
    alert(`Создано ${tasks.length} задач из записи речи!`)
  }

  const handleScreenTasksCreated = (tasks: any[]) => {
    console.log("[v0] Tasks created from screen capture:", tasks)
    alert(`Создано ${tasks.length} задач из скриншота экрана!`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return { variant: "default" as const, text: "Обработано" }
      case "processing":
        return { variant: "secondary" as const, text: "В процессе" }
      case "scheduled":
        return { variant: "outline" as const, text: "В ожидании" }
      default:
        return { variant: "secondary" as const, text: "Неизвестно" }
    }
  }

  useEffect(() => {
    setMeetings([
      {
        title: "Daily Standup - Проект BFinance",
        date: "16 сентября 2025, 10:00",
        duration: "25 мин",
        participants: 8,
        status: "processed",
        tasksCreated: 3,
        transcriptAvailable: true,
      },
      {
        title: "Планирование спринта BFinance Q4",
        date: "16 сентября 2025, 14:30",
        duration: "1ч 45мин",
        participants: 12,
        status: "processed",
        tasksCreated: 7,
        transcriptAvailable: true,
      },
      {
        title: "Ретроспектива запуска BFinance",
        date: "16 сентября 2025, 16:00",
        duration: "1ч 15мин",
        participants: 6,
        status: "processing",
        tasksCreated: 0,
        transcriptAvailable: false,
      },
      {
        title: "Встреча с инвесторами BFinance",
        date: "15 сентября 2025, 11:00",
        duration: "2ч 10мин",
        participants: 5,
        status: "processed",
        tasksCreated: 12,
        transcriptAvailable: true,
      },
    ])

    setScheduledMeetings([
      {
        id: "1",
        title: "Презентация BFinance для инвесторов",
        description: "Демонстрация MVP и финансовых показателей",
        date: "2025-09-17",
        time: "15:00",
        zoomUrl: "https://zoom.us/j/123456789",
        participants: ["investor1@example.com", "ceo@bfinance.com"],
        status: "scheduled",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Техническое ревью BFinance API",
        description: "Обзор архитектуры и планы масштабирования",
        date: "2025-09-18",
        time: "11:30",
        zoomUrl: "https://zoom.us/j/987654321",
        participants: ["tech-lead@bfinance.com", "backend-team@bfinance.com"],
        status: "scheduled",
        createdAt: new Date().toISOString(),
      },
    ])
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Управление встречами</h1>
              <p className="text-muted-foreground">Просматривайте записи встреч и созданные задачи</p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="URL встречи Zoom"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-64"
              />
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleConnectNewMeeting}
                disabled={isConnecting}
              >
                {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Mic className="w-4 h-4 mr-2" />
                {isConnecting ? "Подключение..." : "Подключить встречу"}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Поиск по названию встречи..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Фильтры
            </Button>
          </div>

          <VoiceRecorder onTasksCreated={handleTasksCreated} />

          <ScreenCapture onTasksCreated={handleScreenTasksCreated} />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Запланированные встречи</h2>
            <ScheduledMeetingForm onScheduleMeeting={handleScheduleMeeting} />

            {scheduledMeetings.length > 0 && (
              <div className="space-y-4">
                {scheduledMeetings.map((meeting: any) => {
                  const statusBadge = getStatusBadge(meeting.status)
                  return (
                    <Card key={meeting.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                              <Badge variant={statusBadge.variant}>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {statusBadge.text}
                              </Badge>
                            </div>

                            {meeting.description && (
                              <p className="text-sm text-muted-foreground mb-3">{meeting.description}</p>
                            )}

                            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(meeting.date).toLocaleDateString("ru-RU")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {meeting.time}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {meeting.participants.length} участников
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <Button variant="outline" size="sm" asChild>
                                <a href={meeting.zoomUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Открыть Zoom
                                </a>
                              </Button>
                              <Button variant="ghost" size="sm">
                                Редактировать
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                Отменить
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Meetings List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">История встреч</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Загрузка встреч...</p>
              </div>
            ) : (
              meetings.map((meeting: any, index) => {
                const statusBadge = getStatusBadge(meeting.status)
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                            <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {meeting.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {meeting.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {meeting.participants} участников
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {meeting.transcriptAvailable && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadTranscript(`meeting-${index}`)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Скачать транскрипт
                              </Button>
                            )}
                            {meeting.tasksCreated > 0 && (
                              <Button variant="outline" size="sm" asChild>
                                <a href="/tasks" target="_blank" rel="noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Посмотреть задачи в Jira ({meeting.tasksCreated})
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Play className="w-4 h-4 mr-2" />
                              Воспроизвести
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
