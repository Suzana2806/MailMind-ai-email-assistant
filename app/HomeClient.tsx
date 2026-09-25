"use client";

import {
  Archive,
  Bell,
  ChevronLeft,
  Inbox,
  Mail,
  Menu,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { useEffect, useState } from "react";

type Email = {
  id: string;
  threadId?: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
};

type EmailDetails = Email & {
  body: string;
};

type AIAnalysis = {
  summary: string;
  category: string;
  priority: string;
  keyPoints: string[];
  action: string;
  deadline: string;
};

type ExtractedDate = {
  date: string;
  context: string;
};

function getSenderName(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*</);

  if (match) {
    return match[1].trim();
  }

  return from.split("@")[0];
}

function getInitial(from: string) {
  const name = getSenderName(from);

  return name.charAt(0).toUpperCase() || "?";
}

function getEmailAddress(from: string) {
  const match = from.match(/<([^>]+)>/);

  if (match) return match[1].trim();

  return from.trim();
}

function formatDate(dateString: string) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${date.getUTCFullYear()}-${month}-${day}`;
}

function formatDateTime(dateString: string) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${date.getUTCFullYear()}-${month}-${day} ${hours}:${minutes}`;
}

export default function HomeClient() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emailDetails, setEmailDetails] =
    useState<EmailDetails | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [aiAnalysis, setAiAnalysis] =
    useState<AIAnalysis | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [extractedDates, setExtractedDates] = useState<ExtractedDate[]>([]);
  const [dateLoading, setDateLoading] = useState(false);
  const [dateError, setDateError] = useState("");

  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [generatedReply, setGeneratedReply] = useState("");
  const [replyTone, setReplyTone] = useState("professional");
  const [copied, setCopied] = useState(false);

  async function fetchEmails() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/gmail/messages", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch emails");
      }

      const fetchedEmails: Email[] = data.emails || [];

      setEmails(fetchedEmails);

      if (fetchedEmails.length > 0) {
        setSelectedEmail(fetchedEmails[0]);
        setEmailDetails(null);
        setEmailError("");
        setAiAnalysis(null);
        setAiError("");
        setExtractedDates([]);
        setDateError("");
        setGeneratedReply("");
        setReplyError("");
      } else {
        setSelectedEmail(null);
        setEmailDetails(null);
        setAiAnalysis(null);
      }
    } catch (error) {
      console.error("Failed to load emails:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load your Gmail inbox."
      );
    } finally {
      setLoading(false);
    }
  }

  async function analyzeEmail(email: EmailDetails) {
    try {
      setAiLoading(true);
      setAiError("");
      setAiAnalysis(null);

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to analyze email"
        );
      }

      if (!data.analysis) {
        throw new Error("AI analysis was not returned.");
      }

      setAiAnalysis(data.analysis);
    } catch (error) {
      console.error("AI analysis failed:", error);

      setAiError(
        error instanceof Error
          ? error.message
          : "Unable to analyze this email."
      );
    } finally {
      setAiLoading(false);
    }
  }

  function extractDatesFromText(text: string): ExtractedDate[] {
    if (!text) return [];

    const patterns = [
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+\d{4}\b/gi,
      /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi,
      /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g,
      /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g,
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,
      /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/gi,
      /\b(?:[01]?\d|2[0-3]):[0-5]\d(?:\s*(?:AM|PM))?\b/gi,
      /\b(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s*(?:AM|PM)\b/gi,
    ];

    const found: ExtractedDate[] = [];
    const seen = new Set<string>();

    for (const pattern of patterns) {
      const matches = text.match(pattern) || [];

      for (const match of matches) {
        const clean = match.replace(/(st|nd|rd|th)/gi, "").trim();
        const key = clean.toLowerCase();

        if (seen.has(key)) continue;
        seen.add(key);

        const index = text.indexOf(match);
        const contextStart = Math.max(0, index - 80);
        const contextEnd = Math.min(text.length, index + match.length + 120);
        const context = text
          .slice(contextStart, contextEnd)
          .replace(/\s+/g, " ")
          .trim();

        found.push({ date: clean, context });
      }
    }

    return found.slice(0, 8);
  }

  function handleExtractDates() {
    if (!emailDetails || dateLoading) return;

    setDateLoading(true);
    setDateError("");

    try {
      const dates = extractDatesFromText(emailDetails.body);
      setExtractedDates(dates);

      if (dates.length === 0) {
        setDateError("No clear dates were found in this email.");
      }
    } catch (error) {
      console.error("Date extraction failed:", error);
      setDateError("Unable to extract dates from this email.");
    } finally {
      setDateLoading(false);
    }
  }

  async function handleGenerateReply() {
    if (replyLoading) return;

    if (!emailDetails) {
      if (!selectedEmail) {
        setReplyError("Select an email first.");
        return;
      }

      await fetchEmailDetails(selectedEmail);
      return;
    }

    try {
      setReplyLoading(true);
      setReplyError("");
      setGeneratedReply("");
      setCopied(false);

      const response = await fetch("/api/ai/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailDetails.from,
          subject: emailDetails.subject,
          body: emailDetails.body,
          tone: replyTone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate AI reply");
      }

      setGeneratedReply(data.reply || "");
    } catch (error) {
      console.error("Generate reply error:", error);
      setReplyError(
        error instanceof Error
          ? error.message
          : "Failed to generate AI reply"
      );
    } finally {
      setReplyLoading(false);
    }
  }

  async function handleCopyReply() {
    if (!generatedReply) return;

    try {
      await navigator.clipboard.writeText(generatedReply);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy reply failed:", error);
      setReplyError("Unable to copy the reply.");
    }
  }

  async function handleSendReply() {
    if (!emailDetails || !generatedReply || replyLoading) return;

    try {
      setReplyLoading(true);
      setReplyError("");

      const response = await fetch("/api/gmail/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: getEmailAddress(emailDetails.from),
          subject: emailDetails.subject,
          message: generatedReply,
          threadId: emailDetails.threadId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send reply through Gmail.");
      }

      setGeneratedReply("");
      setCopied(false);
      setReplyError("");
      window.alert("Reply sent successfully through Gmail.");
    } catch (error) {
      console.error("Send reply error:", error);
      setReplyError(
        error instanceof Error
          ? error.message
          : "Failed to send reply through Gmail."
      );
    } finally {
      setReplyLoading(false);
    }
  }

  async function fetchEmailDetails(email: Email) {
    try {
      setEmailLoading(true);
      setEmailError("");

      setEmailDetails(null);
      setAiAnalysis(null);
      setAiError("");

      /*
       * IMPORTANT:
       * This requests the selected email by ID.
       */
      const response = await fetch(
        `/api/gmail/messages/${email.id}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load email"
        );
      }

      if (!data.email) {
        throw new Error(
          "Email details were not returned."
        );
      }

      setEmailDetails(data.email);
    } catch (error) {
      console.error(
        "Failed to load email details:",
        error
      );

      setEmailError(
        error instanceof Error
          ? error.message
          : "Unable to load this email."
      );
    } finally {
      setEmailLoading(false);
    }
  }

  function handleSelectEmail(email: Email) {
    setSelectedEmail(email);

    setAiAnalysis(null);
    setAiError("");
    setExtractedDates([]);
    setDateError("");
    setGeneratedReply("");
    setReplyError("");
    setCopied(false);

    fetchEmailDetails(email);

    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }

  async function handleSummarizeEmail() {
    if (aiLoading) return;

    try {
      setAiError("");

      if (emailDetails) {
        await analyzeEmail(emailDetails);
        return;
      }

      if (selectedEmail) {
        await fetchEmailDetails(selectedEmail);
        return;
      }

      setAiError("Select an email first.");
    } catch (error) {
      console.error("Summarize email failed:", error);

      setAiError(
        error instanceof Error
          ? error.message
          : "Unable to summarize this email."
      );
    }
  }

  useEffect(() => {
    fetchEmails();
  }, []);

  const filteredEmails = emails.filter((email) => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return true;

    return (
      email.from.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query) ||
      email.snippet.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="flex min-h-screen overflow-hidden">
        {/* MOBILE SIDEBAR OVERLAY */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col
            border-r border-white/[0.07] bg-[#0d0d10]
            transition-transform duration-300
            lg:static lg:translate-x-0
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          <div className="flex h-[72px] items-center justify-between border-b border-white/[0.07] px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
                <Sparkles size={18} />
              </div>

              <div>
                <p className="text-[15px] font-semibold tracking-tight">
                  MailMind
                </p>

                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  AI Workspace
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              <Send size={16} />
              Compose
            </button>
          </div>

          <nav className="px-3">
            <SidebarItem
              icon={<Inbox size={17} />}
              label="Inbox"
              count={emails.length}
              active
            />

            <SidebarItem
              icon={<Star size={17} />}
              label="Starred"
            />

            <SidebarItem
              icon={<Send size={17} />}
              label="Sent"
            />

            <SidebarItem
              icon={<Archive size={17} />}
              label="Archive"
            />

            <SidebarItem
              icon={<Trash2 size={17} />}
              label="Trash"
            />
          </nav>

          <div className="mt-7 px-4">
            <SidebarLabel label="AI Workspace" />

            <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                  <Sparkles size={14} />
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-200">
                    AI Assistant
                  </p>

                  <p className="text-[10px] text-zinc-500">
                    Gemini Intelligence
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <AIWorkspaceItem
                  label="Summarize emails"
                  onClick={handleSummarizeEmail}
                  disabled={aiLoading}
                />
                <AIWorkspaceItem
                  label="Extract important dates"
                  onClick={handleExtractDates}
                  disabled={dateLoading}
                />
                <AIWorkspaceItem
                  label="Draft replies"
                  onClick={handleGenerateReply}
                  disabled={replyLoading}
                />
              </div>
            </div>
          </div>

          <div className="mt-auto border-t border-white/[0.07] p-3">
            <SidebarItem
              icon={<Settings size={17} />}
              label="Settings"
            />

            <div className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-semibold ring-1 ring-white/10">
                S
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-200">
                  Gmail Account
                </p>

                <p className="truncate text-[10px] text-zinc-500">
                  Connected
                </p>
              </div>

              <div className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* TOP BAR */}
          <header className="flex h-[72px] shrink-0 items-center gap-4 border-b border-white/[0.07] bg-[#0b0b0e]/95 px-4 backdrop-blur-xl md:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.05] hover:text-white lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold tracking-tight">
                Inbox
              </h1>

              <p className="hidden text-xs text-zinc-500 sm:block">
                Your intelligent email workspace
              </p>
            </div>

            <div className="relative hidden w-full max-w-[300px] md:block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search emails..."
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] pl-9 pr-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500/40"
              />
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
            >
              <Bell size={18} />
            </button>

            <button
              type="button"
              onClick={fetchEmails}
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
              title="Refresh inbox"
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "animate-spin" : ""
                }
              />
            </button>
          </header>

          {/* MOBILE SEARCH */}
          <div className="border-b border-white/[0.07] px-4 py-3 md:hidden">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search emails..."
                className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] pl-9 pr-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500/40"
              />
            </div>
          </div>

          {/* WORKSPACE */}
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* EMAIL LIST */}
            <section className="flex min-h-[320px] w-full flex-col border-b border-white/[0.07] lg:h-[calc(100vh-72px)] lg:w-[340px] lg:shrink-0 lg:border-b-0 lg:border-r">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
                <div className="flex items-center gap-2">
                  <Mail size={15} className="text-zinc-500" />

                  <span className="text-xs font-medium text-zinc-300">
                    Messages
                  </span>

                  <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-500">
                    {filteredEmails.length}
                  </span>
                </div>

                <span className="text-[10px] text-zinc-600">
                  Gmail
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {loading ? (
                  <EmailListLoading />
                ) : error ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                      <ShieldAlert size={19} />
                    </div>

                    <p className="text-sm font-medium text-zinc-300">
                      Gmail unavailable
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={fetchEmails}
                      className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.08]"
                    >
                      Try again
                    </button>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <EmptyInbox />
                ) : (
                  filteredEmails.map((email) => (
                    <EmailListItem
                      key={email.id}
                      email={email}
                      selected={
                        selectedEmail?.id === email.id
                      }
                      onClick={() =>
                        handleSelectEmail(email)
                      }
                    />
                  ))
                )}
              </div>
            </section>

            {/* EMAIL VIEWER */}
            <section className="flex min-h-[500px] min-w-0 flex-1 flex-col border-b border-white/[0.07] lg:h-[calc(100vh-72px)] lg:border-b-0 lg:border-r">
              {selectedEmail ? (
                <>
                  <div className="border-b border-white/[0.07] px-5 py-5 md:px-7">
                    <div className="mb-4 flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.05] hover:text-white"
                      >
                        <ChevronLeft size={17} />
                      </button>

                      <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                        Email
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold tracking-tight text-zinc-100 md:text-2xl">
                      {selectedEmail.subject ||
                        "(No subject)"}
                    </h2>

                    <div className="mt-5 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/80 to-blue-500/80 text-sm font-semibold">
                        {getInitial(selectedEmail.from)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200">
                          {getSenderName(
                            selectedEmail.from
                          )}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {selectedEmail.from}
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-600">
                          To: {selectedEmail.to || "me"}
                        </p>
                      </div>

                      <div className="hidden text-right sm:block">
                        <p className="text-[11px] text-zinc-500">
                          {formatDateTime(
                            selectedEmail.date
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {emailLoading ? (
                      <EmailBodyLoading />
                    ) : emailError ? (
                      <div className="flex h-full items-center justify-center px-6">
                        <div className="max-w-md rounded-xl border border-red-500/20 bg-red-500/[0.04] p-5 text-center">
                          <ShieldAlert
                            size={22}
                            className="mx-auto text-red-400"
                          />

                          <p className="mt-3 text-sm font-medium text-zinc-300">
                            Unable to load this email
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            {emailError}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              fetchEmailDetails(
                                selectedEmail
                              )
                            }
                            className="mt-4 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.05]"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    ) : emailDetails ? (
                      <div className="px-5 py-6 md:px-7 md:py-8">
                        <div className="max-w-3xl whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">
                          {emailDetails.body ||
                            "This email has no readable body."}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center">
                        <div>
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-600">
                            <Mail size={21} />
                          </div>

                          <p className="mt-4 text-sm text-zinc-400">
                            Select the email to load its content
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            The full email is loaded only when
                            needed.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 border-t border-white/[0.07] px-5 py-3">
                    <button
                      type="button"
                      onClick={handleGenerateReply}
                      disabled={!emailDetails || replyLoading}
                      className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send size={14} />
                      {replyLoading ? "Drafting..." : "Draft Reply"}
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
                    >
                      <Archive size={14} />
                      Archive
                    </button>

                    <button
                      type="button"
                      className="ml-auto rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <EmptyEmailViewer />
              )}
            </section>

            {/* AI PANEL */}
            <aside className="hidden w-[310px] shrink-0 flex-col bg-[#0c0c0f] xl:flex">
              <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.07] px-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                  <Sparkles size={14} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-zinc-200">
                    AI Insights
                  </p>

                  <p className="text-[10px] text-zinc-600">
                    Gemini Intelligence
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-blue-500/[0.04] p-4">
                  <div className="flex items-center gap-2">
                    <Zap
                      size={15}
                      className="text-violet-300"
                    />

                    <span className="text-xs font-semibold text-zinc-200">
                      AI Analysis
                    </span>
                  </div>

                  {!selectedEmail ? (
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      Select an email to analyze it with
                      Gemini AI.
                    </p>
                  ) : aiLoading ? (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-xs text-violet-300">
                        <Sparkles
                          size={14}
                          className="animate-pulse"
                        />
                        Gemini is analyzing this email...
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="h-3 w-full animate-pulse rounded bg-white/[0.05]" />
                        <div className="h-3 w-4/5 animate-pulse rounded bg-white/[0.05]" />
                        <div className="h-3 w-3/5 animate-pulse rounded bg-white/[0.05]" />
                      </div>
                    </div>
                  ) : aiError ? (
                    <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.05] p-3">
                      <p className="text-xs leading-5 text-red-400">
                        {aiError}
                      </p>

                      {emailDetails && (
                        <button
                          type="button"
                          onClick={() =>
                            analyzeEmail(emailDetails)
                          }
                          className="mt-3 rounded-lg border border-white/[0.08] px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/[0.05]"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  ) : aiAnalysis ? (
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                          Summary
                        </p>

                        <p className="mt-2 text-xs leading-5 text-zinc-400">
                          {aiAnalysis.summary}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                          <p className="text-[10px] text-zinc-600">
                            Category
                          </p>

                          <p className="mt-1 text-xs font-medium text-violet-300">
                            {aiAnalysis.category}
                          </p>
                        </div>

                        <div className="flex-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                          <p className="text-[10px] text-zinc-600">
                            Priority
                          </p>

                          <p className="mt-1 text-xs font-medium text-amber-300">
                            {aiAnalysis.priority}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                          Key points
                        </p>

                        <div className="space-y-2">
                          {aiAnalysis.keyPoints?.map(
                            (point, index) => (
                              <div
                                key={index}
                                className="flex gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
                              >
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />

                                <p className="text-[11px] leading-4 text-zinc-400">
                                  {point}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                          Recommended action
                        </p>

                        <div className="mt-2 rounded-lg border border-violet-500/10 bg-violet-500/[0.04] p-3">
                          <p className="text-[11px] leading-5 text-zinc-400">
                            {aiAnalysis.action}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                          Deadline
                        </p>

                        <p className="mt-2 text-xs font-medium text-zinc-300">
                          {aiAnalysis.deadline}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          emailDetails &&
                          analyzeEmail(emailDetails)
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2.5 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20"
                      >
                        <RefreshCw size={13} />
                        Analyze Again
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="mt-3 text-xs leading-5 text-zinc-500">
                        Analyze the selected email using
                        Gemini AI.
                      </p>

                      <button
                        type="button"
                        disabled={!emailDetails}
                        onClick={() =>
                          emailDetails &&
                          analyzeEmail(emailDetails)
                        }
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2.5 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Sparkles size={14} />
                        Analyze Email
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                        <Zap size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Important Dates</p>
                        <p className="text-[10px] text-zinc-600">Dates found in this email</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExtractDates}
                      disabled={!emailDetails || dateLoading}
                      className="rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-medium text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {dateLoading ? "Extracting..." : "Extract"}
                    </button>
                  </div>

                  {dateError ? (
                    <p className="mt-3 text-[11px] leading-4 text-zinc-500">{dateError}</p>
                  ) : extractedDates.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {extractedDates.map((item, index) => (
                        <div key={`${item.date}-${index}`} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                          <p className="text-xs font-medium text-blue-300">{item.date}</p>
                          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-500">{item.context}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] leading-4 text-zinc-600">Click Extract to find dates mentioned in the selected email.</p>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                      <Send size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">AI Draft Reply</p>
                      <p className="text-[10px] text-zinc-600">Generate a contextual response</p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <select
                      value={replyTone}
                      onChange={(event) => setReplyTone(event.target.value)}
                      disabled={!emailDetails || replyLoading}
                      className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#111116] px-3 py-2 text-[11px] text-zinc-300 outline-none focus:border-violet-500/40 disabled:opacity-40"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                      <option value="concise">Concise</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleGenerateReply}
                      disabled={!emailDetails || replyLoading}
                      className="rounded-lg bg-violet-500/10 px-3 py-2 text-[11px] font-medium text-violet-300 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {replyLoading ? "Drafting..." : "Generate"}
                    </button>
                  </div>

                  {replyError && (
                    <p className="mt-3 text-[11px] leading-4 text-red-400">{replyError}</p>
                  )}

                  {generatedReply && (
                    <div className="mt-3">
                      <textarea
                        value={generatedReply}
                        onChange={(event) => setGeneratedReply(event.target.value)}
                        rows={9}
                        className="w-full resize-y rounded-lg border border-white/[0.08] bg-[#09090b] p-3 text-[11px] leading-5 text-zinc-300 outline-none focus:border-violet-500/40"
                      />

                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={handleCopyReply}
                          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.07]"
                        >
                          {copied ? "Copied" : "Copy Reply"}
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateReply}
                          disabled={replyLoading}
                          className="flex-1 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2 text-[11px] font-medium text-violet-300 transition hover:bg-violet-500/10 disabled:opacity-40"
                        >
                          Regenerate
                        </button>
                        <button
                          type="button"
                          onClick={handleSendReply}
                          disabled={!generatedReply || replyLoading}
                          className="flex-1 rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {replyLoading ? "Sending..." : "Send Gmail"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Intelligence
                  </p>

                  <div className="space-y-2">
                    <AIStat
                      icon={<Sparkles size={14} />}
                      label="Summary"
                      value={
                        aiLoading
                          ? "Analyzing..."
                          : aiAnalysis
                          ? "Available"
                          : "Not analyzed"
                      }
                    />

                    <AIStat
                      icon={<Zap size={14} />}
                      label="Priority"
                      value={
                        aiAnalysis?.priority ||
                        "Pending"
                      }
                    />

                    <AIStat
                      icon={<ShieldAlert size={14} />}
                      label="Action"
                      value={
                        aiAnalysis?.action ||
                        "Pending"
                      }
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Key information
                  </p>

                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    <KeyValue
                      label="Sender"
                      value={
                        selectedEmail
                          ? getSenderName(
                              selectedEmail.from
                            )
                          : "—"
                      }
                    />

                    <KeyValue
                      label="Date"
                      value={
                        selectedEmail
                          ? formatDate(
                              selectedEmail.date
                            )
                          : "—"
                      }
                    />

                    <KeyValue
                      label="Category"
                      value={
                        aiAnalysis?.category ||
                        "Not classified"
                      }
                      last
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={14}
                      className="text-zinc-500"
                    />

                    <span className="text-xs font-medium text-zinc-300">
                      AI capabilities
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <Suggestion
                      text="Summarize this email"
                      onClick={handleSummarizeEmail}
                      disabled={aiLoading}
                    />
                    <Suggestion
                      text="Extract important dates"
                      onClick={handleExtractDates}
                      disabled={dateLoading}
                    />
                    <Suggestion
                      text="Draft a reply"
                      onClick={handleGenerateReply}
                      disabled={replyLoading}
                    />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

/* SIDEBAR */

function SidebarItem({
  icon,
  label,
  count,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`
        mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5
        text-left text-xs transition
        ${
          active
            ? "bg-white/[0.07] text-white"
            : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
        }
      `}
    >
      <span
        className={
          active ? "text-violet-300" : "text-zinc-500"
        }
      >
        {icon}
      </span>

      <span className="flex-1">{label}</span>

      {count !== undefined && (
        <span className="text-[10px] text-zinc-500">
          {count}
        </span>
      )}
    </button>
  );
}

function SidebarLabel({ label }: { label: string }) {
  return (
    <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
      {label}
    </p>
  );
}

function AIWorkspaceItem({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-[11px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="mr-2 h-1 w-1 rounded-full bg-violet-400" />
      {label}
    </button>
  );
}

/* EMAIL LIST */

function EmailListItem({
  email,
  selected,
  onClick,
}: {
  email: Email;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full border-b border-white/[0.05] px-4 py-4 text-left transition
        ${
          selected
            ? "bg-violet-500/[0.07]"
            : "hover:bg-white/[0.025]"
        }
      `}
    >
      <div className="flex gap-3">
        <div
          className={`
            flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold
            ${
              selected
                ? "bg-violet-500/20 text-violet-300"
                : "bg-white/[0.06] text-zinc-400"
            }
          `}
        >
          {getInitial(email.from)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-medium text-zinc-300">
              {getSenderName(email.from)}
            </p>

            <span className="shrink-0 text-[9px] text-zinc-600">
              {formatDate(email.date)}
            </span>
          </div>

          <p className="mt-1 truncate text-xs font-medium text-zinc-400">
            {email.subject || "(No subject)"}
          </p>

          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-zinc-600">
            {email.snippet || "No preview available."}
          </p>
        </div>
      </div>
    </button>
  );
}

/* AI */

function AIStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-zinc-600">
          {label}
        </p>

        <p className="mt-0.5 truncate text-xs text-zinc-400">
          {value}
        </p>
      </div>
    </div>
  );
}

function KeyValue({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`
        flex items-center justify-between gap-3 px-3 py-3
        ${!last ? "border-b border-white/[0.05]" : ""}
      `}
    >
      <span className="text-[10px] text-zinc-600">
        {label}
      </span>

      <span className="max-w-[160px] truncate text-right text-[10px] text-zinc-400">
        {value}
      </span>
    </div>
  );
}

function Suggestion({
  text,
  onClick,
  disabled = false,
}: {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Sparkles
        size={12}
        className="mr-2 text-zinc-600"
      />
      {text}
    </button>
  );
}

/* LOADING */

function EmailListLoading() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="flex gap-3 border-b border-white/[0.05] px-4 py-4"
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-white/[0.05]" />

          <div className="min-w-0 flex-1">
            <div className="h-3 w-24 rounded bg-white/[0.05]" />

            <div className="mt-2 h-3 w-40 rounded bg-white/[0.05]" />

            <div className="mt-2 h-2.5 w-full rounded bg-white/[0.035]" />

            <div className="mt-1 h-2.5 w-3/4 rounded bg-white/[0.035]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmailBodyLoading() {
  return (
    <div className="animate-pulse px-5 py-8 md:px-7">
      <div className="h-3 w-4/5 rounded bg-white/[0.05]" />
      <div className="mt-4 h-3 w-full rounded bg-white/[0.05]" />
      <div className="mt-3 h-3 w-full rounded bg-white/[0.05]" />
      <div className="mt-3 h-3 w-5/6 rounded bg-white/[0.05]" />
      <div className="mt-8 h-3 w-3/4 rounded bg-white/[0.05]" />
      <div className="mt-3 h-3 w-full rounded bg-white/[0.05]" />
      <div className="mt-3 h-3 w-2/3 rounded bg-white/[0.05]" />
    </div>
  );
}

/* EMPTY */

function EmptyInbox() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-600">
        <Inbox size={22} />
      </div>

      <p className="mt-4 text-sm font-medium text-zinc-400">
        No emails found
      </p>

      <p className="mt-1 text-xs leading-5 text-zinc-600">
        Your Gmail inbox is empty or no messages match your
        search.
      </p>
    </div>
  );
}

function EmptyEmailViewer() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] text-zinc-600">
        <Mail size={24} />
      </div>

      <h2 className="mt-5 text-sm font-medium text-zinc-400">
        Select an email
      </h2>

      <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-600">
        Choose a message from your inbox to view the full
        conversation and AI-powered insights.
      </p>
    </div>
  );
}