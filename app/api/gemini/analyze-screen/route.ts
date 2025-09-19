import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting screen analysis process...")

    const { imageData, mimeType, sessionId } = await request.json()
    console.log("[v0] Received screen capture request with sessionId:", sessionId)

    if (!GEMINI_API_KEY) {
      console.error("[v0] Gemini API key not configured")
      return NextResponse.json({ success: false, error: "Gemini API key not configured" }, { status: 500 })
    }

    if (!imageData) {
      throw new Error("No image data provided")
    }

    console.log("[v0] Image data length:", imageData.length)

    const model = genAI.getGenerativeModel({ model: "ai" })

    const prompt = `
    Проанализируй этот скриншот экрана и извлеки следующую информацию НА РУССКОМ ЯЗЫКЕ:
    1. Весь видимый текст на изображении (OCR)
    2. Задачи, проекты или действия, которые можно определить из интерфейса
    3. Статусы задач если они видны (К выполнению, В работе, Готово, и т.д.)
    4. Приоритеты если указаны
    5. Ответственных лиц если видны
    6. Дедлайны или даты если есть
    7. Названия проектов или команд
    
    Особое внимание обрати на:
    - Kanban доски (Trello, Jira, Asana, Notion)
    - Списки задач и чек-листы
    - Календари с событиями
    - Документы с планами и задачами
    - Чаты с упоминанием задач
    - Презентации с action items
    
    Для каждой найденной задачи определи:
    - Статус на основе колонки/раздела где она находится
    - Приоритет по цветам или меткам
    - Контекст проекта
    
    ВАЖНО: ВСЕ ТЕКСТЫ В ОТВЕТЕ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ!
    
    Верни результат в JSON формате:
    {
      "extractedText": "весь извлеченный текст на русском",
      "tasks": [
        {
          "title": "название задачи на русском",
          "description": "описание из контекста на русском",
          "assignee": "ответственный если виден",
          "deadline": "дедлайн если есть",
          "priority": "Высокий/Средний/Низкий",
          "status": "К выполнению/В работе/Готово",
          "project": "название проекта если определено",
          "source": "откуда извлечена (Jira/Trello/документ/чат)"
        }
      ],
      "interface_type": "тип интерфейса (Jira/Trello/Notion/документ/чат/календарь)",
      "project_context": "общий контекст проекта на русском",
      "confidence": "уровень уверенности в извлеченных данных (высокий/средний/низкий)"
    }
    `

    console.log("[v0] Sending to Gemini AI for screen analysis...")
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "image/png",
          data: imageData,
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
        extractedText: analysisText,
        tasks: [],
        interface_type: "unknown",
        project_context: "Не удалось определить контекст",
        confidence: "низкий",
      }
    }

    console.log("[v0] Analysis extracted tasks:", analysis.tasks?.length || 0)

    // Create tasks in Jira
    const createdTasks = []
    for (const task of analysis.tasks || []) {
      const jiraResult = await createJiraTaskFromScreen(task, sessionId, analysis.interface_type)
      if (jiraResult) {
        createdTasks.push(jiraResult)
      }
    }

    console.log("[v0] Successfully processed", createdTasks.length, "tasks from screen capture")

    return NextResponse.json({
      success: true,
      analysis,
      createdTasks,
      totalProcessed: createdTasks.length,
      message: `Скриншот успешно обработан. Создано задач: ${createdTasks.length}`,
    })
  } catch (error) {
    console.error("[v0] Screen analysis error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка анализа скриншота: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}

async function createJiraTaskFromScreen(task: any, sessionId: string, interfaceType: string) {
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN?.trim()
  const JIRA_EMAIL = process.env.JIRA_EMAIL?.trim()
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.trim()

  if (!JIRA_API_TOKEN || !JIRA_EMAIL || !JIRA_BASE_URL) {
    console.error("[v0] Jira credentials not configured")
    return null
  }

  try {
    console.log("[v0] Creating Jira task from screen capture:", task.title)

    // Get projects
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

    // Get issue types
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
                  text: `${task.description}\n\nИсточник: Анализ скриншота\nСессия: ${sessionId}\nТип интерфейса: ${task.source || interfaceType}\nПроект: ${task.project || "Не указан"}\nОтветственный: ${task.assignee || "Не назначен"}\nСтатус: ${task.status || "К выполнению"}`,
                },
              ],
            },
          ],
        },
        issuetype: {
          name: issueTypeName,
        },
        ...(task.priority && {
          priority: {
            name: task.priority === "Высокий" ? "High" : task.priority === "Низкий" ? "Low" : "Medium",
          },
        }),
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
    console.log("[v0] Created Jira task from screen:", result.key)

    return {
      key: result.key,
      title: task.title,
      status: task.status,
      source: task.source || interfaceType,
      project: task.project,
    }
  } catch (error) {
    console.error("[v0] Jira task creation error:", error)
    return null
  }
}
