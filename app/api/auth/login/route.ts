import { NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/google";

export async function GET() {
  const oauth2Client = getGoogleOAuthClient();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.modify",
    ],
    prompt: "consent",
  });

  return NextResponse.redirect(authUrl);
}