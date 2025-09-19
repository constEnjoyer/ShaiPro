import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, CheckSquare, TrendingUp } from "lucide-react"

export default function TeamPage() {
  const teamMembers = [
    {
      id: 5,
      name: "Жигер Жапар",
      role: "AI Engineer",
      email: "zhiger.zhapar@company.com",
      meetingsThisWeek: 7,
      tasksCompleted: 14,
      productivity: 93,
    },
    {
      id: 6,
      name: "Тулеубаев Адиль",
      role: "Data Scientist",
      email: "adil.tuleubaev@company.com",
      meetingsThisWeek: 5,
      tasksCompleted: 11,
      productivity: 91,
    },
  ]

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 90) return "bg-green-100 text-green-800"
    if (productivity >= 80) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Команда</h1>
            <p className="text-muted-foreground">Обзор активности и продуктивности участников команды</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {teamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                    </div>
                    <Badge className={getProductivityColor(member.productivity)}>{member.productivity}%</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">{member.meetingsThisWeek}</span>
                      <span className="text-xs text-muted-foreground">Встреч</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <CheckSquare className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">{member.tasksCompleted}</span>
                      <span className="text-xs text-muted-foreground">Задач</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">{member.productivity}%</span>
                      <span className="text-xs text-muted-foreground">Эффективность</span>
                    </div>
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
