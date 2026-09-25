import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleOAuthClient } from "@/lib/google";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("gmail_refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Gmail is not connected.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const to = body.to || "";
    const subject = body.subject || "";
    const message = body.message || "";
    const threadId = body.threadId || "";

    if (!to || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipient and message are required.",
        },
        { status: 400 }
      );
    }

    const oauth2Client = getGoogleOAuthClient();

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const emailSubject = subject.startsWith("Re:")
      ? subject
      : `Re: ${subject}`;

    const rawMessage = [
      `To: ${to}`,
      `Subject: ${emailSubject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      message,
    ].join("\r\n");

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        ...(threadId ? { threadId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully.",
      messageId: response.data.id,
      threadId: response.data.threadId,
    });
  } catch (error) {
    console.error("Gmail send reply error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send reply through Gmail.",
      },
      { status: 500 }
    );
  }
}