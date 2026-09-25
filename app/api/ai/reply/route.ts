import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is missing from .env.local",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const from = body.from || "";
    const subject = body.subject || "";
    const emailBody = body.body || "";
    const tone = body.tone || "professional";

    if (!emailBody) {
      return NextResponse.json(
        {
          success: false,
          error: "Email body is required",
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are an AI email assistant called MailMind.

Generate a reply to the email below.

Email sender:
${from}

Email subject:
${subject}

Email content:
${emailBody}

Desired tone:
${tone}

Instructions:
- Write only the email reply.
- Do not include explanations.
- Do not mention that you are an AI.
- Keep the reply natural and professional.
- Understand the context of the email before replying.
- Do not invent facts, dates, names, promises, or commitments.
- If information is missing, write the reply in a way that does not assume it.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    return NextResponse.json({
      success: true,
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini reply error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate email reply",
      },
      { status: 500 }
    );
  }
}