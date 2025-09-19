import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting transcription process...")

    const { audioData, audioUrl, mimeType, meetingId } = await request.json()
    console.log("[v0] Received request with meetingId:", meetingId)

    if (!GEMINI_API_KEY) {
      console.error("[v0] Gemini API key not configured")
      return NextResponse.json({ success: false, error: "Gemini API key not configured" }, { status: 500 })
    }

    let audioBase64: string

    if (audioData) {
      console.log("[v0] Processing direct audio data...")
      audioBase64 = audioData
    } else if (audioUrl) {
      console.log("[v0] Downloading audio from URL...")
      const audioResponse = await fetch(audioUrl)
      const audioBuffer = await audioResponse.arrayBuffer()
      audioBase64 = Buffer.from(audioBuffer).toString("base64")
    } else {
      throw new Error("No audio data or URL provided")
    }

    console.log("[v0] Audio data length:", audioBase64.length)

    const model = genAI.getGenerativeModel({ model: "ai" })

    const prompt = `
    Пожалуйста, расшифруй эту аудиозапись встречи и извлеки следующую информацию:
    1. Полная транскрипция разговора
    2. Список задач и действий (action items)
    3. Ответственные лица за каждую задачу
    4. Дедлайны если упоминались
    5. Статус каждой задачи на основе контекста
    6. Ключевые решения принятые на встрече
    7. ВАЖНО: Обновления существующих задач (например, "запущен стартап", "завершили найм", "создали канал")
    
    Для определения статуса задач используй следующую логику:
    - "To Do" - новые задачи, планируемые действия, будущие встречи
    - "In Progress" - задачи которые уже начаты, текущие проекты, задачи в процессе выполнения
    - "Done" - завершенные задачи, выполненные действия, прошедшие встречи, задачи о которых говорят в прошедшем времени
    
    Особое внимание обрати на фразы типа:
    - "мы создали", "мы сделали", "завершили", "запустили" = Done
    - "мы работаем над", "в процессе", "делаем сейчас" = In Progress
    - "нужно сделать", "планируем", "будем делать" = To Do
    
    Верни результат в JSON формате:
    {
      "transcription": "полная расшифровка",
      "tasks": [
        {
          "title": "название задачи",
          "description": "описание",
          "assignee": "ответственный",
          "deadline": "дедлайн если есть",
          "priority": "высокий/средний/низкий",
          "status": "To Do/In Progress/Done",
          "isUpdate": false
        }
      ],
      "taskUpdates": [
        {
          "searchKeywords": ["ключевые слова для поиска существующей задачи"],
          "newStatus": "Done/In Progress",
          "reason": "причина обновления статуса"
        }
      ],
      "decisions": ["решение 1", "решение 2"],
      "participants": ["участник 1", "участник 2"]
    }
    `

    console.log("[v0] Sending to Gemini AI...")
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: audioBase64,
        },
      },
      prompt,
    ])

    const response = result.response
    const analysisText = response.text()
    console.log("[v0] Gemini response received, length:", analysisText.length)

    let analysis
    try {
      // Clean the response text to extract JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
        console.log("[v0] Successfully parsed JSON response")
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("[v0] JSON parsing failed:", parseError)
      // Fallback analysis
      analysis = {
        transcription: analysisText,
        tasks: [],
        taskUpdates: [],
        decisions: [],
        participants: [],
      }
    }

    console.log("[v0] Analysis extracted tasks:", analysis.tasks?.length || 0)
    console.log("[v0] Analysis extracted task updates:", analysis.taskUpdates?.length || 0)

    const updatedTasks = []
    if (analysis.taskUpdates && analysis.taskUpdates.length > 0) {
      for (const update of analysis.taskUpdates) {
        const updatedTask = await updateExistingJiraTask(update)
        if (updatedTask) {
          updatedTasks.push(updatedTask)
        }
      }
    }

    const createdTasks = []
    for (const task of analysis.tasks || []) {
      const jiraResult = await createJiraTask(task, meetingId)
      if (jiraResult) {
        createdTasks.push(jiraResult)
      }
    }

    const totalProcessed = createdTasks.length + updatedTasks.length
    console.log(
      "[v0] Successfully processed",
      totalProcessed,
      "tasks (",
      createdTasks.length,
      "created,",
      updatedTasks.length,
      "updated)",
    )

    return NextResponse.json({
      success: true,
      analysis,
      createdTasks,
      updatedTasks,
      totalProcessed,
      message: `Встреча успешно обработана. Создано задач: ${createdTasks.length}, обновлено: ${updatedTasks.length}`,
    })
  } catch (error) {
    console.error("[v0] Transcription error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка обработки аудио: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}

async function createJiraTask(task: any, meetingId: string) {
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN?.trim()
  const JIRA_EMAIL = process.env.JIRA_EMAIL?.trim()
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.trim()

  if (!JIRA_API_TOKEN || !JIRA_EMAIL || !JIRA_BASE_URL) {
    console.error("[v0] Jira credentials not configured")
    return null
  }

  try {
    console.log("[v0] Creating Jira task from meeting:", task.title)

    const projectsResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
        Accept: "application/json",
      },
    })

    if (!projectsResponse.ok) {
      console.error("[v0] Failed to fetch projects:", projectsResponse.status)
      return null
    }

    const projects = await projectsResponse.json()
    const projectKey =
      projects.find((p: any) => p.key === "CRM")?.key ||
      projects.find((p: any) => p.name.includes("LEARNJIRA") || p.key.includes("LEARN"))?.key ||
      projects[0]?.key

    if (!projectKey) {
      console.error("[v0] No accessible projects found")
      return null
    }

    console.log("[v0] Using project key:", projectKey)

    const statusesResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project/${projectKey}/statuses`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
        Accept: "application/json",
      },
    })

    let availableStatuses: any[] = []
    if (statusesResponse.ok) {
      const statusesData = await statusesResponse.json()
      const allStatuses = statusesData.flatMap((issueType: any) => issueType.statuses || [])
      availableStatuses = allStatuses.filter(
        (status: any, index: number, self: any[]) => index === self.findIndex((s: any) => s.name === status.name),
      )
      console.log(
        "[v0] Available statuses:",
        availableStatuses.map((s: any) => s.name),
      )
    }

    const issueTypesResponse = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
          Accept: "application/json",
        },
      },
    )

    let issueTypeName = "Task"
    if (issueTypesResponse.ok) {
      const issueTypesMeta = await issueTypesResponse.json()
      const issueTypes = issueTypesMeta.projects[0]?.issuetypes || []
      const availableType = issueTypes.find(
        (type: any) => type.name === "Task" || type.name === "Story" || type.name === "Bug",
      )
      if (availableType) {
        issueTypeName = availableType.name
      }
    }

    const jiraTask = {
      fields: {
        project: {
          key: projectKey,
        },
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
                  text: `${task.description}\n\nИз встречи: ${meetingId}\nОтветственный: ${task.assignee || "Не назначен"}\nСтатус: ${task.status || "To Do"}`,
                },
              ],
            },
          ],
        },
        issuetype: {
          name: issueTypeName,
        },
      },
    }

    const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jiraTask),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Failed to create Jira task:", response.status, errorText)
      return null
    }

    const result = await response.json()
    console.log("[v0] Created Jira task:", result.key)

    if (task.status && task.status !== "To Do") {
      await setJiraTaskStatus(result.key, task.status, availableStatuses)
    }

    return { key: result.key, title: task.title, status: task.status }
  } catch (error) {
    console.error("[v0] Jira task creation error:", error)
    return null
  }
}

async function setJiraTaskStatus(issueKey: string, targetStatus: string, availableStatuses: any[]) {
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN?.trim()
  const JIRA_EMAIL = process.env.JIRA_EMAIL?.trim()
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.trim()

  try {
    const transitionsResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
        Accept: "application/json",
      },
    })

    if (!transitionsResponse.ok) {
      console.error("[v0] Failed to get transitions for", issueKey)
      return
    }

    const transitionsData = await transitionsResponse.json()
    const transitions = transitionsData.transitions || []

    const targetTransition = transitions.find(
      (t: any) =>
        t.to.name.toLowerCase().includes(targetStatus.toLowerCase()) ||
        (targetStatus === "In Progress" && (t.to.name === "In Progress" || t.to.name === "В работе")) ||
        (targetStatus === "Done" && (t.to.name === "Done" || t.to.name === "Готово" || t.to.name === "Выполнено")),
    )

    if (targetTransition) {
      console.log(`[v0] Transitioning ${issueKey} to ${targetStatus} via transition ${targetTransition.id}`)

      const transitionResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transition: {
            id: targetTransition.id,
          },
        }),
      })

      if (transitionResponse.ok) {
        console.log(`[v0] Successfully set status ${targetStatus} for ${issueKey}`)
      } else {
        console.error(`[v0] Failed to transition ${issueKey}:`, await transitionResponse.text())
      }
    } else {
      console.log(`[v0] No transition found for status ${targetStatus} on ${issueKey}`)
    }
  } catch (error) {
    console.error("[v0] Error setting task status:", error)
  }
}

async function updateExistingJiraTask(update: any) {
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN?.trim()
  const JIRA_EMAIL = process.env.JIRA_EMAIL?.trim()
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.trim()

  if (!JIRA_API_TOKEN || !JIRA_EMAIL || !JIRA_BASE_URL) {
    console.error("[v0] Jira credentials not configured")
    return null
  }

  try {
    console.log("[v0] Searching for existing tasks with keywords:", update.searchKeywords)

    // Search for existing tasks using JQL
    const searchQuery = update.searchKeywords
      .map((keyword: string) => `summary ~ "${keyword}" OR description ~ "${keyword}"`)
      .join(" OR ")

    const jql = `project = CRM AND (${searchQuery}) ORDER BY created DESC`

    const searchResponse = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=5`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
          Accept: "application/json",
        },
      },
    )

    if (!searchResponse.ok) {
      console.error("[v0] Failed to search for existing tasks:", searchResponse.status)
      return null
    }

    const searchResults = await searchResponse.json()
    const existingTasks = searchResults.issues || []

    if (existingTasks.length === 0) {
      console.log("[v0] No existing tasks found for keywords:", update.searchKeywords)
      return null
    }

    const taskToUpdate = existingTasks[0]
    console.log("[v0] Found existing task to update:", taskToUpdate.key, "-", taskToUpdate.fields.summary)

    const oldStatus = taskToUpdate.fields.status.name
    console.log("[v0] Current status:", oldStatus, "-> Target status:", update.newStatus)

    // Get available statuses for the task
    const statusesResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project/CRM/statuses`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
        Accept: "application/json",
      },
    })

    let availableStatuses: any[] = []
    if (statusesResponse.ok) {
      const statusesData = await statusesResponse.json()
      const allStatuses = statusesData.flatMap((issueType: any) => issueType.statuses || [])
      availableStatuses = allStatuses.filter(
        (status: any, index: number, self: any[]) => index === self.findIndex((s: any) => s.name === status.name),
      )
    }

    // Update the task status
    await setJiraTaskStatus(taskToUpdate.key, update.newStatus, availableStatuses)

    console.log("[v0] Successfully updated task status:", taskToUpdate.key)
    return {
      key: taskToUpdate.key,
      title: taskToUpdate.fields.summary,
      oldStatus: oldStatus,
      newStatus: update.newStatus,
      reason: update.reason,
      action: "updated",
    }
  } catch (error) {
    console.error("[v0] Error updating existing task:", error)
    return null
  }
}
