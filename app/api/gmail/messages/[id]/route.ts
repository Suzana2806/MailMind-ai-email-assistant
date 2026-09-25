
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleOAuthClient } from "@/lib/google";

function decodeBase64Url(data: string): string {
  const base64 = data
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  return Buffer.from(base64, "base64").toString("utf-8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

function extractBody(payload: any): string {
  let htmlBody = "";
  let textBody = "";

  function searchParts(part: any) {
    if (!part) return;

    const mimeType = part.mimeType || "";
    const data = part.body?.data;

    if (data) {
      const decoded = decodeBase64Url(data);

      if (mimeType === "text/html" && !htmlBody) {
        htmlBody = decoded;
      }

      if (mimeType === "text/plain" && !textBody) {
        textBody = decoded;
      }
    }

    if (part.parts && Array.isArray(part.parts)) {
      for (const child of part.parts) {
        searchParts(child);
      }
    }
  }

  searchParts(payload);

  // Prefer HTML because some emails contain
  // incomplete or placeholder text/plain content.
  if (htmlBody) {
    return stripHtml(htmlBody);
  }

  if (textBody) {
    return textBody.trim();
  }

  return "";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const refreshToken =
      request.cookies.get("gmail_refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: "Gmail is not connected",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Email ID is required",
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

    const response = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });

    const message = response.data;

    console.log(
      "EMAIL PAYLOAD:",
      JSON.stringify(message.payload, null, 2)
    );

    const headers = message.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find(
        (header) =>
          header.name?.toLowerCase() === name.toLowerCase()
      )?.value || "";

    const body = extractBody(message.payload);

    return NextResponse.json({
      success: true,
      email: {
        id: message.id,
        threadId: message.threadId,
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        body,
        snippet: message.snippet || "",
      },
    });
  } catch (error) {
    console.error("Gmail message error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch Gmail message",
      },
      { status: 500 }
    );
  }
}

