import { type NextRequest, NextResponse } from "next/server"

const JIRA_API_TOKEN =
  process.env.JIRA_API_TOKEN ||
  "ATATT3xFfGF0wmW1tMr2Uslkvy4Lb6-CkPP_F42gSkDGZgIzDvvpHOnQhp93l5UQi17DpCzVtlXyLck34JRwlR8QgwIh_-82i7Bon5ZhMGJWqzAiPo7xlWtnVCRGIIRAPi3oT4ht-nn4BxBPN_V4Zw5jzdYEryqEFV3nr3kaOffbSQs6Q5JDss0="
const JIRA_EMAIL = process.env.JIRA_EMAIL || "otsosinzhiger@gmail.com"
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || "https://otsosinzhiger.atlassian.net"

function validateCredentials() {
  if (!JIRA_API_TOKEN || !JIRA_EMAIL) {
    throw new Error("Jira credentials not configured. Please set JIRA_API_TOKEN and JIRA_EMAIL environment variables.")
  }
}

function createAuthHeader() {
  const auth = `${JIRA_EMAIL}:${JIRA_API_TOKEN}`
  const encoded = Buffer.from(auth).toString("base64")
  return `Basic ${encoded}`
}

export async function GET() {
  try {
    validateCredentials()

    console.log("[v0] Attempting to fetch Jira tasks...")
    console.log("[v0] Base URL:", JIRA_BASE_URL)
    console.log("[v0] Email:", JIRA_EMAIL)

    const testResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/myself`, {
      headers: {
        Authorization: createAuthHeader(),
        Accept: "application/json",
      },
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error("[v0] Authentication failed:", testResponse.status, errorText)
      throw new Error(`Authentication failed: ${testResponse.status} - Please check your API token and email`)
    }

    const userInfo = await testResponse.json()
    console.log("[v0] Authenticated as:", userInfo.displayName)

    const projectsResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project`, {
      headers: {
        Authorization: createAuthHeader(),
        Accept: "application/json",
      },
    })

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`)
    }

    const projects = await projectsResponse.json()
    console.log("[v0] Raw projects response:", projects)
    console.log(
      "[v0] Available projects:",
      projects.map((p: any) => `${p.key} (${p.name})`),
    )

    const projectKey =
      projects.find((p: any) => p.key === "CRM")?.key ||
      projects.find((p: any) => p.name.includes("LEARNJIRA") || p.key.includes("LEARN"))?.key ||
      projects[0]?.key

    if (!projectKey) {
      throw new Error("No accessible projects found")
    }

    console.log("[v0] Using project key:", projectKey)

    const response = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/search?jql=project=${projectKey} ORDER BY created DESC&maxResults=50`,
      {
        headers: {
          Authorization: createAuthHeader(),
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Jira API error:", response.status, errorText)

      if (response.status === 401) {
        return NextResponse.json(
          {
            success: false,
            error: "Неверный API токен или email. Проверьте настройки аутентификации.",
          },
          { status: 401 },
        )
      }

      if (response.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error: "Недостаточно прав доступа. Проверьте права пользователя в Jira.",
          },
          { status: 403 },
        )
      }

      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log("[v0] Successfully fetched", data.issues?.length || 0, "tasks from Jira")

    return NextResponse.json({
      success: true,
      user: userInfo.displayName,
      projectKey,
      tasks: data.issues || [],
    })
  } catch (error) {
    console.error("[v0] Jira fetch error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Ошибка получения задач из Jira",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    validateCredentials()

    const { title, description, assignee } = await request.json()

    console.log("[v0] Creating Jira task:", { title })

    const projectsResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/project`, {
      headers: {
        Authorization: createAuthHeader(),
        Accept: "application/json",
      },
    })

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`)
    }

    const projects = await projectsResponse.json()
    const projectKey =
      projects.find((p: any) => p.key === "CRM")?.key ||
      projects.find((p: any) => p.name.includes("LEARNJIRA") || p.key.includes("LEARN"))?.key ||
      projects[0]?.key

    if (!projectKey) {
      throw new Error("No accessible projects found")
    }

    console.log("[v0] Using project key:", projectKey)

    const issueTypesResponse = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes`,
      {
        headers: {
          Authorization: createAuthHeader(),
          Accept: "application/json",
        },
      },
    )

    let issueTypeName = "Task"
    if (issueTypesResponse.ok) {
      const issueTypesMeta = await issueTypesResponse.json()
      const issueTypes = issueTypesMeta.projects[0].issuetypes
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
        summary: title,
        description: description
          ? {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: description,
                    },
                  ],
                },
              ],
            }
          : undefined,
        issuetype: {
          name: issueTypeName,
        },
      },
    }

    if (!description) {
      delete jiraTask.fields.description
    }

    const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: createAuthHeader(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jiraTask),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Failed to create task:", response.status, errorText)

      if (response.status === 400) {
        return NextResponse.json(
          {
            success: false,
            error: "Неверные данные задачи. Проверьте поля и попробуйте снова.",
            details: errorText,
          },
          { status: 400 },
        )
      }

      throw new Error(`Failed to create task: ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] Successfully created task:", result.key)

    return NextResponse.json({
      success: true,
      task: result,
      message: `Задача ${result.key} успешно создана в Jira`,
    })
  } catch (error) {
    console.error("[v0] Jira task creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Ошибка создания задачи в Jira",
      },
      { status: 500 },
    )
  }
}
