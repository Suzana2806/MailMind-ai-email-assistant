import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleOAuthClient } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("gmail_refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: "Gmail is not connected",
        },
        { status: 401 }
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

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      labelIds: ["INBOX"],
    });

    const messages = response.data.messages || [];

    const emails = [];

    for (const message of messages) {
      if (!message.id) continue;

      const email = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      });

      const headers = email.data.payload?.headers || [];

      const getHeader = (name: string) =>
        headers.find(
          (header) =>
            header.name?.toLowerCase() === name.toLowerCase()
        )?.value || "";

      emails.push({
        id: message.id,
        threadId: message.threadId,
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        snippet: email.data.snippet || "",
      });
    }

    return NextResponse.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error("Gmail API error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch Gmail messages",
      },
      { status: 500 }
    );
  }
}