"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toast, useToast } from "@/components/ui/toast"
import { Mic, Square, Loader2, Brain, CheckCircle, Zap, RefreshCw } from "lucide-react"

interface VoiceRecorderProps {
  onTasksCreated?: (tasks: any[]) => void
}

export function VoiceRecorder({ onTasksCreated }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<
    "transcribing" | "analyzing" | "creating" | "updating" | "completed" | null
  >(null)
  const [transcript, setTranscript] = useState("")
  const [recordingTime, setRecordingTime] = useState(0)
  const [createdTasks, setCreatedTasks] = useState<any[]>([])
  const [updatedTasks, setUpdatedTasks] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  const { toast, toasts } = useToast()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      console.log("[v0] Starting voice recording...")

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log("[v0] Recording stopped, processing audio...")
        await processRecording()
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      toast({
        type: "error",
        title: "Ошибка доступа к микрофону",
        description: "Проверьте разрешения для доступа к микрофону в браузере.",
      })
    }
  }

  const stopRecording = () => {
    console.log("[v0] Stopping recording...")

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log("[v0] No audio data to process")
      return
    }

    setIsProcessing(true)
    setAnalysisStep("transcribing")

    try {
      console.log("[v0] Creating audio blob...")
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1]

        console.log("[v0] Sending audio to Gemini for transcription...")

        try {
          setAnalysisStep("analyzing")

          const response = await fetch("/api/gemini/transcribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              audioData: base64Audio,
              mimeType: "audio/webm",
              meetingId: `voice-${Date.now()}`,
            }),
          })

          const result = await response.json()

          if (result.success) {
            if (result.updatedTasks && result.updatedTasks.length > 0) {
              setAnalysisStep("updating")
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }

            setAnalysisStep("creating")
            await new Promise((resolve) => setTimeout(resolve, 1000))

            console.log("[v0] Transcription successful:", result.analysis)
            console.log("[v0] Tasks created:", result.createdTasks?.length || 0)
            console.log("[v0] Tasks updated:", result.updatedTasks?.length || 0)

            setTranscript(result.analysis.transcription || "Транскрипция обработана")
            setCreatedTasks(result.createdTasks || [])
            setUpdatedTasks(result.updatedTasks || [])

            if (onTasksCreated && result.analysis.tasks) {
              onTasksCreated(result.analysis.tasks)
            }

            setAnalysisStep("completed")
            setShowSuccess(true)

            toast({
              type: "success",
              title: "Встреча успешно обработана!",
              description: `Создано задач: ${result.createdTasks?.length || 0}, обновлено: ${result.updatedTasks?.length || 0}`,
              duration: 5000,
            })

            setTimeout(() => {
              setShowSuccess(false)
              setAnalysisStep(null)
            }, 3000)
          } else {
            console.error("[v0] Transcription failed:", result.error)
            toast({
              type: "error",
              title: "Ошибка обработки",
              description: result.error,
            })
            setAnalysisStep(null)
          }
        } catch (error) {
          console.error("[v0] API call failed:", error)
          toast({
            type: "error",
            title: "Ошибка отправки",
            description: "Не удалось отправить аудио на обработку",
          })
          setAnalysisStep(null)
        }
      }

      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error("[v0] Processing error:", error)
      toast({
        type: "error",
        title: "Ошибка обработки",
        description: "Не удалось обработать запись",
      })
      setAnalysisStep(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const renderAnalysisStep = () => {
    if (!analysisStep) return null

    const steps = {
      transcribing: { icon: Mic, text: "Распознавание речи...", color: "text-blue-500" },
      analyzing: { icon: Brain, text: "ИИ анализирует встречу...", color: "text-purple-500" },
      updating: { icon: RefreshCw, text: "Обновление существующих задач...", color: "text-yellow-500" },
      creating: { icon: Zap, text: "Создание новых задач в Jira...", color: "text-orange-500" },
      completed: { icon: CheckCircle, text: "Задачи успешно обработаны!", color: "text-green-500" },
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
            <Mic className="w-5 h-5" />
            Запись речи в реальном времени
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isRecording && !isProcessing && (
                <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                  <Mic className="w-4 h-4 mr-2" />
                  Начать запись
                </Button>
              )}

              {isRecording && (
                <Button onClick={stopRecording} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  Остановить запись
                </Button>
              )}

              {isProcessing && (
                <Button disabled>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Обработка...
                </Button>
              )}
            </div>

            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          {renderAnalysisStep()}

          {showSuccess && (
            <div className="text-center py-6 animate-bounce">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-green-600">
                Отлично! Создано {createdTasks.length} задач, обновлено {updatedTasks.length}
              </p>
            </div>
          )}

          {transcript && !showSuccess && (
            <div className="space-y-2">
              <h4 className="font-medium">Транскрипция:</h4>
              <div className="p-3 bg-muted rounded-md text-sm">{transcript}</div>
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

          {updatedTasks.length > 0 && !showSuccess && (
            <div className="space-y-2">
              <h4 className="font-medium">Обновленные задачи ({updatedTasks.length}):</h4>
              <div className="space-y-2">
                {updatedTasks.map((task, index) => (
                  <div key={index} className="p-3 border rounded-md bg-yellow-50 hover:bg-yellow-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium">{task.title}</h5>
                        <p className="text-sm text-muted-foreground">{task.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Статус изменен: {task.oldStatus} → {task.newStatus}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">Обновлено</Badge>
                        <Badge variant={task.newStatus === "Done" ? "default" : "outline"}>
                          {task.newStatus === "Done"
                            ? "Готово"
                            : task.newStatus === "In Progress"
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
