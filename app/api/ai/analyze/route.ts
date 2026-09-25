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

    if (!body.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email data is required",
        },
        { status: 400 }
      );
    }

    const email = body.email;

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are MailMind, an intelligent AI email assistant.

Analyze the following email.

Return ONLY valid JSON.

EMAIL:

From: ${email.from || "Unknown"}

To: ${email.to || "Unknown"}

Subject: ${email.subject || "No subject"}

Date: ${email.date || "Unknown"}

Body:
${email.body || email.snippet || "No body available"}

Return exactly this JSON structure:

{
  "summary": "Short 2-3 sentence summary",
  "category": "Work",
  "priority": "Medium",
  "keyPoints": [
    "Important point 1",
    "Important point 2",
    "Important point 3"
  ],
  "action": "Recommended action for the user",
  "deadline": "Deadline mentioned in the email, or None"
}

Category must be exactly one of:
Work, Education, Placement, Finance, Personal, Promotion, Social, Other

Priority must be exactly one of:
High, Medium, Low

If there is no clear action:
"No action required"

If there is no deadline:
"None"

Do not use markdown.
Do not use code fences.
Return ONLY JSON.
`;

   
let response;

try {
  response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: prompt,
  });
} catch (firstError) {
  console.error("First Gemini analysis attempt failed:", firstError);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });
  } catch (secondError) {
    console.error("Second Gemini analysis attempt failed:", secondError);

    return NextResponse.json(
      {
        success: false,
        error:
          "Gemini is temporarily busy. Please click Summarize again in a few seconds.",
      },
      { status: 503 }
    );
  }
}
    const text = response.text?.trim();

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    let cleanedText = text;

    // Remove accidental markdown code fences
    cleanedText = cleanedText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let analysis;

    try {
      analysis = JSON.parse(cleanedText);
    } catch {
      console.error("Invalid Gemini JSON:", cleanedText);

      throw new Error(
        "Gemini returned an invalid analysis format. Please try again."
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Gemini analysis error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Gemini analysis failed";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}