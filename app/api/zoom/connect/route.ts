import { type NextRequest, NextResponse } from "next/server"

const ZOOM_CLIENT_ID = "TiYWCAbeTAi_G8s2XiCw7w"
const ZOOM_CLIENT_SECRET = "EKFlEJALkyB62UJd3Fc889PM31OKPMy7"
const ZOOM_ACCOUNT_ID = "q6bRgrwGSu-SOovEIVs2zg"

export async function POST(request: NextRequest) {
  try {
    const { meetingUrl } = await request.json()

    // Get Zoom OAuth token
    const tokenResponse = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=account_credentials&account_id=" + ZOOM_ACCOUNT_ID,
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error("Failed to get Zoom access token")
    }

    // Extract meeting ID from URL
    const meetingId = extractMeetingId(meetingUrl)

    // Get meeting details
    const meetingResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const meetingData = await meetingResponse.json()

    return NextResponse.json({
      success: true,
      meeting: meetingData,
      message: "Успешно подключено к встрече Zoom",
    })
  } catch (error) {
    console.error("Zoom connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка подключения к Zoom",
      },
      { status: 500 },
    )
  }
}

function extractMeetingId(url: string): string {
  const match = url.match(/\/j\/(\d+)/)
  return match ? match[1] : url
}
