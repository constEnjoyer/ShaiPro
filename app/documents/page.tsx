import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye, Calendar, User } from "lucide-react"

export default function DocumentsPage() {
  const documents = [
    {
      id: "DOC-001",
      title: "Протокол встречи - Планирование спринта BFinance",
      type: "Протокол",
      createdDate: "16.09.2025",
      createdBy: "AI Meeting Agent",
      size: "2.3 MB",
      format: "PDF",
      meetingId: "MEET-001",
    },
    {
      id: "DOC-002",
      title: "Техническая спецификация - BFinance API v2.0",
      type: "Спецификация",
      createdDate: "15.09.2025",
      createdBy: "Иван Петров",
      size: "1.8 MB",
      format: "DOCX",
      meetingId: "MEET-002",
    },
    {
      id: "DOC-003",
      title: "Отчет по ретроспективе команды BFinance",
      type: "Отчет",
      createdDate: "14.09.2025",
      createdBy: "AI Meeting Agent",
      size: "950 KB",
      format: "PDF",
      meetingId: "MEET-003",
    },
    {
      id: "DOC-004",
      title: "План действий - BFinance Q4 2025",
      type: "План",
      createdDate: "13.09.2025",
      createdBy: "Мария Сидорова",
      size: "1.2 MB",
      format: "PDF",
      meetingId: "MEET-004",
    },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Протокол":
        return "bg-blue-100 text-blue-800"
      case "Спецификация":
        return "bg-purple-100 text-purple-800"
      case "Отчет":
        return "bg-green-100 text-green-800"
      case "План":
        return "bg-orange-100 text-orange-800"
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Документы</h1>
            <p className="text-muted-foreground">Автоматически созданные документы и протоколы встреч</p>
          </div>

          <div className="grid gap-6">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {doc.format} • {doc.size}
                      </CardDescription>
                    </div>
                    <Badge className={getTypeColor(doc.type)}>{doc.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {doc.createdDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {doc.createdBy}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Просмотр
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
