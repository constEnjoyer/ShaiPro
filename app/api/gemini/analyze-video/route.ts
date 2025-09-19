import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { videoData, mimeType, sessionId } = await request.json()

    console.log(`[v0] Starting video analysis for session: ${sessionId}`)

    if (!videoData) {
      return NextResponse.json({ success: false, error: "No video data provided" })
    }

    let model
    let modelName = "gemini-1.5-flash" // Much cheaper and faster

    try {
      model = genAI.getGenerativeModel({ model: modelName })
    } catch (error) {
      console.log("[v0] Flash model not available, trying pro model")
      model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
      modelName = "gemini-1.5-pro"
    }

    const videoPart = {
      inlineData: {
        data: videoData,
        mimeType: mimeType,
      },
    }

    const prompt = `Проанализируй это видео и извлеки задачи. Отвечай ТОЛЬКО на русском языке. Верни JSON:
{
  "tasks": [
    {
      "title": "название задачи на русском",
      "description": "краткое описание на русском", 
      "priority": "Высокий/Средний/Низкий",
      "status": "К выполнению/В работе/Готово"
    }
  ]
}

Ищи: текст в интерфейсе, обсуждения, планы, дедлайны. Описания должны быть краткими. ВСЕ ТЕКСТЫ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ!`

    let result
    try {
      result = await model.generateContent([prompt, videoPart])
    } catch (error: any) {
      if (error.message?.includes("quota") || error.message?.includes("429")) {
        return NextResponse.json({
          success: false,
          error: "API quota exceeded. Please wait a moment and try again, or upgrade your Gemini API plan.",
          quotaExceeded: true,
        })
      }
      throw error
    }

    const response = await result.response
    const text = response.text()

    console.log(`[v0] Gemini video analysis response (${modelName}): ${text.substring(0, 200)}...`)

    let analysis
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("[v0] Failed to parse Gemini response:", parseError)
      return NextResponse.json({
        success: false,
        error: "Не удалось обработать ответ от ИИ",
      })
    }

    const createdTasks = []
    if (analysis.tasks && analysis.tasks.length > 0) {
      const tasksToCreate = analysis.tasks.slice(0, 5)

      for (const task of tasksToCreate) {
        try {
          const jiraResponse = await fetch(`${process.env.JIRA_BASE_URL}/rest/api/3/issue`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString(
                "base64",
              )}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fields: {
                project: { key: "CRM" }, // Changed from DEMO to CRM
                summary: task.title,
                description: {
                  type: "doc",
                  version: 1,
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: `${task.description}\n\nИсточник: Анализ видео\nСессия: ${sessionId}`,
                        },
                      ],
                    },
                  ],
                },
                issuetype: { name: "Task" },
                priority: {
                  name: task.priority === "Высокий" ? "High" : task.priority === "Низкий" ? "Low" : "Medium",
                },
              },
            }),
          })

          if (jiraResponse.ok) {
            const jiraTask = await jiraResponse.json()
            createdTasks.push({
              ...task,
              jiraKey: jiraTask.key,
              jiraId: jiraTask.id,
            })
            console.log(`[v0] Created Jira task from video: ${jiraTask.key}`)
          } else {
            const errorText = await jiraResponse.text()
            console.error(
              `[v0] Failed to create Jira task from video. Status: ${jiraResponse.status}, Response: ${errorText}`,
            )
          }
        } catch (error) {
          console.error("[v0] Failed to create Jira task from video:", error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      createdTasks,
      sessionId,
      modelUsed: modelName,
    })
  } catch (error) {
    console.error("[v0] Video analysis error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}
