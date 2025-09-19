import { NextResponse } from "next/server"

const JIRA_API_TOKEN =
  process.env.JIRA_API_TOKEN ||
  "ATATT3xFfGF0wmW1tMr2Uslkvy4Lb6-CkPP_F42gSkDGZgIzDvvpHOnQhp93l5UQi17DpCzVtlXyLck34JRwlR8QgwIh_-82i7Bon5ZhMGJWqzAiPo7xlWtnVCRGIIRAPi3oT4ht-nn4BxBPN_V4Zw5jzdYEryqEFV3nr3kaOffbSQs6Q5JDss0="
const JIRA_EMAIL = process.env.JIRA_EMAIL || "otsosinzhiger@gmail.com"
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || "https://otsosinzhiger.atlassian.net"

function createAuthHeader() {
  const cleanToken = JIRA_API_TOKEN.trim()
  const cleanEmail = JIRA_EMAIL.trim()

  console.log("[v0] Creating auth header...")
  console.log("[v0] Email:", cleanEmail)
  console.log("[v0] Token length:", cleanToken.length)
  console.log("[v0] Token starts with:", cleanToken.substring(0, 15) + "...")
  console.log("[v0] Token ends with:", "..." + cleanToken.substring(cleanToken.length - 15))

  const auth = `${cleanEmail}:${cleanToken}`
  const encoded = Buffer.from(auth, "utf8").toString("base64")

  console.log("[v0] Auth string length:", auth.length)
  console.log("[v0] Base64 encoded length:", encoded.length)

  return `Basic ${encoded}`
}

export async function GET() {
  try {
    console.log("[v0] Fetching available Jira projects...")
    console.log("[v0] Base URL:", JIRA_BASE_URL)

    const authHeader = createAuthHeader()
    console.log("[v0] Testing authentication...")

    const testResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/myself`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] Auth test response status:", testResponse.status)
    console.log("[v0] Auth test response headers:", Object.fromEntries(testResponse.headers.entries()))

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error("[v0] Authentication failed:", testResponse.status, errorText)

      let errorMessage = `Authentication failed: ${testResponse.status}`
      if (testResponse.status === 401) {
        errorMessage += " - Invalid API token or email. Please check your credentials."
      } else if (testResponse.status === 403) {
        errorMessage += " - Access denied. Please check your permissions."
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorText,
        },
        { status: testResponse.status },
      )
    }

    const userInfo = await testResponse.json()
    console.log("[v0] Authenticated successfully as:", userInfo.displayName)
    console.log("[v0] User account ID:", userInfo.accountId)

    const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/project`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Failed to fetch projects:", response.status, errorText)

      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch projects: ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const projects = await response.json()
    console.log("[v0] Found", projects.length, "projects")
    console.log(
      "[v0] Available projects:",
      projects.map((p: any) => `${p.key} (${p.name})`),
    )

    return NextResponse.json({
      success: true,
      user: userInfo.displayName,
      accountId: userInfo.accountId,
      projects: projects.map((project: any) => ({
        key: project.key,
        name: project.name,
        id: project.id,
        projectTypeKey: project.projectTypeKey,
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching projects:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
