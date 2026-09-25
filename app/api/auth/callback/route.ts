import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/google";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code not found" },
      { status: 400 }
    );
  }

  try {
    const oauth2Client = getGoogleOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);

    console.log("Google OAuth successful");
    console.log("Access token received:", !!tokens.access_token);
    console.log("Refresh token received:", !!tokens.refresh_token);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          error:
            "No refresh token received. Re-authorize the Google account.",
        },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      message: "Gmail connected successfully!",
      authenticated: true,
    });

    response.cookies.set("gmail_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Google OAuth error:", error);

    return NextResponse.json(
      {
        error: "Google authentication failed",
      },
      { status: 500 }
    );
  }
}
