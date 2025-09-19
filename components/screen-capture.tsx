"use client"
import { useState, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toast, useToast } from "@/components/ui/toast"
import { Monitor, Camera, Square, Loader2, Brain, CheckCircle, Zap, Eye, Upload, AlertCircle } from "lucide-react"

interface ScreenCaptureProps {
  onTasksCreated?: (tasks: any[]) => void
}

export function ScreenCapture({ onTasksCreated }: ScreenCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<
    "capturing" | "analyzing" | "extracting" | "creating" | "completed" | null
  >(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [createdTasks, setCreatedTasks] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [screenCaptureSupported, setScreenCaptureSupported] = useState(true)

  const { toast, toasts } = useToast()
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startScreenCapture = async () => {
    try {
      console.log("[v0] Starting screen capture...")
      setIsCapturing(true)
      setAnalysisStep("capturing")

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen capture API not supported")
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: "screen",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream

      const video = document.createElement("video")
      video.srcObject = stream
      video.play()

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve
      })

      setTimeout(() => {
        captureScreenshot(video, stream)
      }, 2000)
    } catch (error) {
      console.error("[v0] Error starting screen capture:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (
        errorMessage.includes("disallowed by permissions policy") ||
        errorMessage.includes("Screen capture API not supported")
      ) {
        setScreenCaptureSupported(false)
        toast({
          type: "error",
          title: "Захват экрана недоступен",
          description: "Используйте загрузку файла для анализа скриншотов.",
        })
      } else {
        toast({
          type: "error",
          title: "Ошибка захвата экрана",
          description: "Проверьте разрешения для захвата экрана в браузере.",
        })
      }

      setIsCapturing(false)
      setAnalysisStep(null)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({
        type: "error",
        title: "Неверный формат файла",
        description: "Пожалуйста, выберите изображение (PNG, JPG, JPEG) или видео (MP4, MOV, AVI).",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const fileData = e.target?.result as string
      setCapturedImage(fileData)

      if (file.type.startsWith("video/")) {
        processVideo(fileData, file.type)
      } else {
        processScreenshot(fileData)
      }
    }
    reader.readAsDataURL(file)
  }

  const captureScreenshot = async (video: HTMLVideoElement, stream: MediaStream) => {
    try {
      console.log("[v0] Capturing screenshot...")

      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      ctx.drawImage(video, 0, 0)

      const imageData = canvas.toDataURL("image/png")
      setCapturedImage(imageData)

      stream.getTracks().forEach((track) => track.stop())
      setIsCapturing(false)

      await processScreenshot(imageData)
    } catch (error) {
      console.error("[v0] Error capturing screenshot:", error)
      toast({
        type: "error",
        title: "Ошибка создания скриншота",
        description: "Не удалось создать скриншот экрана.",
      })
      setIsCapturing(false)
      setAnalysisStep(null)
    }
  }

  const processScreenshot = async (imageData: string) => {
    setIsProcessing(true)
    setAnalysisStep("analyzing")

    try {
      console.log("[v0] Sending screenshot to AI for analysis...")

      const base64Image = imageData.split(",")[1]

      setAnalysisStep("extracting")

      const response = await fetch("/api/gemini/analyze-screen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: base64Image,
          mimeType: "image/png",
          sessionId: `screen-${Date.now()}`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setAnalysisStep("creating")
        await new Promise((resolve) => setTimeout(resolve, 1000))

        console.log("[v0] Screen analysis successful:", result.analysis)
        console.log("[v0] Tasks created:", result.createdTasks?.length || 0)

        setExtractedText(result.analysis.extractedText || "Текст извлечен из скриншота")
        setCreatedTasks(result.createdTasks || [])

        if (onTasksCreated && result.analysis.tasks) {
          onTasksCreated(result.analysis.tasks)
        }

        setAnalysisStep("completed")
        setShowSuccess(true)

        toast({
          type: "success",
          title: "Скриншот успешно обработан!",
          description: `Создано задач: ${result.createdTasks?.length || 0}`,
          duration: 5000,
        })

        setTimeout(() => {
          setShowSuccess(false)
          setAnalysisStep(null)
        }, 3000)
      } else {
        console.error("[v0] Screen analysis failed:", result.error)
        toast({
          type: "error",
          title: "Ошибка анализа",
          description: result.error,
        })
        setAnalysisStep(null)
      }
    } catch (error) {
      console.error("[v0] API call failed:", error)
      toast({
        type: "error",
        title: "Ошибка отправки",
        description: "Не удалось отправить скриншот на обработку",
      })
      setAnalysisStep(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const processVideo = async (videoData: string, mimeType: string) => {
    setIsProcessing(true)
    setAnalysisStep("analyzing")

    try {
      console.log("[v0] Sending video to AI for analysis...")

      const base64Video = videoData.split(",")[1]

      setAnalysisStep("extracting")

      const response = await fetch("/api/gemini/analyze-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoData: base64Video,
          mimeType: mimeType,
          sessionId: `video-${Date.now()}`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setAnalysisStep("creating")
        await new Promise((resolve) => setTimeout(resolve, 1000))

        console.log("[v0] Video analysis successful:", result.analysis)
        console.log("[v0] Tasks created:", result.createdTasks?.length || 0)

        setExtractedText(result.analysis.extractedText || "Текст извлечен из видео")
        setCreatedTasks(result.createdTasks || [])

        if (onTasksCreated && result.analysis.tasks) {
          onTasksCreated(result.analysis.tasks)
        }

        setAnalysisStep("completed")
        setShowSuccess(true)

        toast({
          type: "success",
          title: "Видео успешно обработано!",
          description: `Создано задач: ${result.createdTasks?.length || 0}.}`,
          duration: 5000,
        })

        setTimeout(() => {
          setShowSuccess(false)
          setAnalysisStep(null)
        }, 3000)
      } else {
        console.error("[v0] Video analysis failed:", result.error)

        if (result.quotaExceeded) {
          toast({
            type: "error",
            title: "Превышена квота API",
            description: "Подождите немного и попробуйте снова, или обновите план Gemini API для больших лимитов.",
            duration: 8000,
          })
        } else {
          toast({
            type: "error",
            title: "Ошибка анализа видео",
            description: result.error,
          })
        }
        setAnalysisStep(null)
      }
    } catch (error) {
      console.error("[v0] Video API call failed:", error)
      toast({
        type: "error",
        title: "Ошибка отправки видео",
        description: "Не удалось отправить видео на обработку",
      })
      setAnalysisStep(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
    setAnalysisStep(null)
  }

  const renderAnalysisStep = () => {
    if (!analysisStep) return null

    const steps = {
      capturing: { icon: Monitor, text: "Захват экрана...", color: "text-blue-500" },
      analyzing: { icon: Eye, text: "ИИ анализирует изображение...", color: "text-purple-500" },
      extracting: { icon: Brain, text: "Извлечение текста и задач...", color: "text-yellow-500" },
      creating: { icon: Zap, text: "Создание задач в Jira...", color: "text-orange-500" },
      completed: { icon: CheckCircle, text: "Задачи успешно созданы!", color: "text-green-500" },
    }

    const step = steps[analysisStep]
    const Icon = step.icon

    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-lg border-2 border-dashed ${
          analysisStep === "completed" ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
        } transition-all duration-500`}
      >
        <Icon className={`w-6 h-6 ${step.color} ${analysisStep !== "completed" ? "animate-pulse" : ""}`} />
        <span className={`font-medium ${step.color}`}>{step.text}</span>
        {analysisStep !== "completed" && <Loader2 className={`w-4 h-4 ${step.color} animate-spin ml-auto`} />}
      </div>
    )
  }

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Анализ экрана с помощью ИИ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!screenCaptureSupported && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Захват экрана недоступен в этом браузере. Используйте загрузку файла.
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {screenCaptureSupported && !isCapturing && !isProcessing && (
                <Button onClick={startScreenCapture} className="bg-blue-500 hover:bg-blue-600">
                  <Camera className="w-4 h-4 mr-2" />
                  Захватить экран
                </Button>
              )}

              {!isCapturing && !isProcessing && (
                <>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:bg-blue-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Загрузить файл
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}

              {isCapturing && (
                <Button onClick={stopCapture} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  Остановить захват
                </Button>
              )}

              {isProcessing && (
                <Button disabled>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Обработка...
                </Button>
              )}
            </div>

            {isCapturing && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono">Захват экрана...</span>
              </div>
            )}
          </div>

          {renderAnalysisStep()}

          {showSuccess && (
            <div className="text-center py-6 animate-bounce">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-green-600">
                Отлично! Создано {createdTasks.length} задач из файла
              </p>
            </div>
          )}

          {capturedImage && !showSuccess && (
            <div className="space-y-2">
              <h4 className="font-medium">Захваченное изображение или видео:</h4>
              <div className="border rounded-md overflow-hidden">
                <img
                  src={capturedImage || "/placeholder.svg"}
                  alt="Captured screen or video"
                  className="w-full h-48 object-contain bg-gray-100"
                />
              </div>
            </div>
          )}

          {extractedText && !showSuccess && (
            <div className="space-y-2">
              <h4 className="font-medium">Извлеченный текст:</h4>
              <div className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">{extractedText}</div>
            </div>
          )}

          {createdTasks.length > 0 && !showSuccess && (
            <div className="space-y-2">
              <h4 className="font-medium">Созданные задачи ({createdTasks.length}):</h4>
              <div className="space-y-2">
                {createdTasks.map((task, index) => (
                  <div key={index} className="p-3 border rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium">{task.title}</h5>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        {task.assignee && task.assignee !== "Не указано" && (
                          <p className="text-xs text-muted-foreground mt-1">Ответственный: {task.assignee}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{task.priority || "средний"}</Badge>
                        <Badge
                          variant={
                            task.status === "Done" ? "default" : task.status === "In Progress" ? "secondary" : "outline"
                          }
                        >
                          {task.status === "Done"
                            ? "Готово"
                            : task.status === "In Progress"
                              ? "В работе"
                              : "К выполнению"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
