"use client"
import { useState } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Link, Plus, X } from "lucide-react"

interface ScheduledMeetingFormProps {
  onScheduleMeeting: (meeting: any) => void
}

export function ScheduledMeetingForm({ onScheduleMeeting }: ScheduledMeetingFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    zoomUrl: "",
    participants: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.date || !formData.time || !formData.zoomUrl) {
      alert("Пожалуйста, заполните все обязательные поля")
      return
    }

    const scheduledMeeting = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      zoomUrl: formData.zoomUrl,
      participants: formData.participants
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p),
      status: "scheduled",
      createdAt: new Date().toISOString(),
    }

    onScheduleMeeting(scheduledMeeting)

    // Reset form
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      zoomUrl: "",
      participants: "",
    })
    setIsOpen(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!isOpen) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <Button
            onClick={() => setIsOpen(true)}
            variant="ghost"
            className="w-full h-20 text-muted-foreground hover:text-primary"
          >
            <Plus className="w-6 h-6 mr-2" />
            Запланировать новую встречу
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Запланировать встречу</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название встречи *</Label>
              <Input
                id="title"
                placeholder="Например: Daily Standup BFinance"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants">Участники (через запятую)</Label>
              <Input
                id="participants"
                placeholder="john@example.com, jane@example.com"
                value={formData.participants}
                onChange={(e) => handleInputChange("participants", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Краткое описание встречи..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Дата *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Время *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoomUrl">Ссылка на Zoom *</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="zoomUrl"
                type="url"
                placeholder="https://zoom.us/j/123456789"
                value={formData.zoomUrl}
                onChange={(e) => handleInputChange("zoomUrl", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              <Calendar className="w-4 h-4 mr-2" />
              Запланировать встречу
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
