import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mic, Download, Play, FileText } from "lucide-react"

export default function RecordingsPage() {
  const recordings = [
    {
      id: "REC-001",
      title: "Планирование спринта BFinance",
      date: "16.09.2025",
      duration: "45 мин",
      participants: 8,
      transcriptStatus: "Готов",
      tasksCreated: 3,
      platform: "Zoom",
    },
    {
      id: "REC-002",
      title: "Ретроспектива команды BFinance",
      date: "15.09.2025",
      duration: "30 мин",
      participants: 6,
      transcriptStatus: "Обрабатывается",
      tasksCreated: 1,
      platform: "Meet",
    },
    {
      id: "REC-003",
      title: "Техническое обсуждение BFinance API",
      date: "14.09.2025",
      duration: "60 мин",
      participants: 4,
      transcriptStatus: "Готов",
      tasksCreated: 2,
      platform: "Zoom",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Готов":
        return "bg-green-100 text-green-800"
      case "Обрабатывается":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Записи встреч</h1>
            <p className="text-muted-foreground">
              Аудиозаписи встреч с автоматической расшифровкой и извлечением задач
            </p>
          </div>

          <div className="grid gap-6">
            {recordings.map((recording) => (
              <Card key={recording.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Mic className="w-5 h-5 text-primary" />
                        {recording.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {recording.date} • {recording.duration} • {recording.participants} участников
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{recording.platform}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(recording.transcriptStatus)}>{recording.transcriptStatus}</Badge>
                      <div className="text-sm text-muted-foreground">Создано задач: {recording.tasksCreated}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Воспроизвести
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Транскрипт
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Скачать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
