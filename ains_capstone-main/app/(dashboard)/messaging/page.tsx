"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Inter, Anton } from "next/font/google";

import { http } from "@/lib/http";
import { listContacts, type Contact } from "@/lib/services/contacts";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const anton = Anton({ subsets: ["latin"], weight: ["400"] });

// ---- backend types ----
type Channel = "" | "sms" | "gmail" | "both";
const channelMap: Record<Exclude<Channel, "">, "SMS" | "Gmail" | "Both"> = {
  sms: "SMS",
  gmail: "Gmail",
  both: "Both",
};

type SendMessageRequest = {
  channel: "SMS" | "Gmail" | "Both";
  content: string;
  recipients: string[]; // client IDs
  subject?: string;
};

type ScheduleMessageRequest = SendMessageRequest & {
  scheduledFor: string; // "YYYY-MM-DDTHH:MM"
};

// shape we use in UI for recent messages
type RecentMessage = {
  id: number;
  clientId: string;
  channel: "SMS" | "Gmail" | "Both";
  content: string;
  createdAt: string;
  status?: string;
};

// ---- SMS segment helper ----
const GSM7_REGEX =
  /^[\n\r !\"#\$%&'\(\)\*\+,\-\.\/0-9:;<=>\?@A-Z_ÄÖÑÜ§¿a-zäöñüà£¥èéùìòÇØøÅåΔΦΓΛΩΠΨΣΘΞ^{}\\\[~\]|€]*$/;

function countSmsSegments(text: string) {
  if (!text) return { charset: "GSM-7", limit: 160, used: 0, segments: 0 };
  const isGsm7 = GSM7_REGEX.test(text);
  if (isGsm7) {
    if (text.length <= 160)
      return { charset: "GSM-7", limit: 160, used: text.length, segments: 1 };
    return {
      charset: "GSM-7",
      limit: 153,
      used: text.length,
      segments: Math.ceil(text.length / 153),
    };
  } else {
    if (text.length <= 70)
      return { charset: "UCS-2", limit: 70, used: text.length, segments: 1 };
    return {
      charset: "UCS-2",
      limit: 67,
      used: text.length,
      segments: Math.ceil(text.length / 67),
    };
  }
}

type RowStatus = "pending" | "sending" | "success" | "error";

interface RecipientRow {
  id: string;
  status: RowStatus;
  error?: string;
}

// ---- masking helpers ----

function maskEmail(email?: string | null): string {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain) return "********";
  const visible = user.slice(-4); // show last 4 chars
  const masked = "*".repeat(Math.max(user.length - visible.length, 3));
  return `${masked}${visible}@${domain}`;
}

function maskPhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "*".repeat(digits.length);
  const visible = digits.slice(-4);
  const masked = "*".repeat(digits.length - 4);
  return `${masked}${visible}`;
}

export default function MessagingPage() {
  // message & channel
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState<Channel>("");

  // scheduling
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // selected client IDs (from Contacts page + added here)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [manualRaw, setManualRaw] = useState("");
  const [addFromContactsId, setAddFromContactsId] = useState("");

  // sending progress
  const [rows, setRows] = useState<RecipientRow[]>([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const abortRef = useRef(false);

  // recent messages (from backend)
  const [recent, setRecent] = useState<RecentMessage[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // ---- helpers for recent messages ----
  function normalizeRecent(raw: any): RecentMessage[] {
    const arr: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
      ? raw.items
      : [];
    return arr.map((r, idx) => ({
      id: Number(r?.id ?? idx),
      clientId: String(r?.client_code ?? r?.clientId ?? ""),
      channel:
        r?.channel === "Gmail" || r?.channel === "Both" ? r.channel : "SMS",
      content: String(r?.content ?? ""),
      createdAt: String(r?.created_at ?? r?.createdAt ?? ""),
      status: r?.status ? String(r.status) : undefined,
    }));
  }

  function formatWhen(iso: string) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

  async function loadRecent() {
    try {
      setRecentLoading(true);
      const data = await http.get("/messaging/recent");
      setRecent(normalizeRecent(data));
    } catch {
      setRecent([]);
    } finally {
      setRecentLoading(false);
    }
  }

  // ✅ CLEAR ALL RECENT (with confirm prompt)
  async function handleClearRecent() {
    const ok = confirm(
      "Are you sure you want to delete all recent messages? This cannot be undone."
    );
    if (!ok) return;

    try {
      await http.delete("/messaging/recent");
      setRecent([]); // instant UI update
    } catch (e: any) {
      alert(e?.message || "Failed to clear recent messages.");
    }
  }

  // ---- load contacts ----
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingContacts(true);
        const data = await listContacts();
        if (!mounted) return;
        setContacts(data);
      } catch {
        if (!mounted) return;
        setContacts([]);
      } finally {
        if (mounted) setLoadingContacts(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ---- initial load of recent messages ----
  useEffect(() => {
    loadRecent();
  }, []);

  // ---- pull recipients from Contacts page (localStorage) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem("recipientsDraft");
      if (!raw) return;
      const ids: string[] = JSON.parse(raw);
      if (Array.isArray(ids) && ids.length) {
        setSelectedIds(new Set(ids.map((x) => String(x))));
      }
    } catch {
      // ignore parse errors
    } finally {
      localStorage.removeItem("recipientsDraft");
    }
  }, []);

  // manual IDs (extra)
  const manualIds = useMemo(
    () =>
      manualRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [manualRaw]
  );

  // final recipients = selected from contacts + manual
  const recipients = useMemo(() => {
    const set = new Set<string>([...selectedIds, ...manualIds]);
    return Array.from(set);
  }, [selectedIds, manualIds]);

  // resolved contact info (for display)
  const resolved = useMemo(
    () =>
      recipients.map((id) => ({
        id,
        contact: contacts.find((c) => c.id === id) || null,
      })),
    [recipients, contacts]
  );

  // options for "Add from contacts" select
  const availableToAdd = useMemo(
    () => contacts.filter((c) => !selectedIds.has(c.id)),
    [contacts, selectedIds]
  );

  function addSelectedFromContacts() {
    if (!addFromContactsId) return;
    setSelectedIds((prev) => new Set(prev).add(addFromContactsId));
    setAddFromContactsId("");
  }

  function addAllFromContacts() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      availableToAdd.forEach((c) => next.add(c.id));
      return next;
    });
  }

  function removeSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // validations
  const smsStats = useMemo(() => countSmsSegments(message), [message]);
  const hasChannel = channel !== "";
  const hasMessage = message.trim().length > 0;
  const hasRecipients = recipients.length > 0;
  const canSend = hasChannel && hasMessage && hasRecipients && !sending;

  // simple ETA
  const etaMs = hasRecipients
    ? Math.max(
        0,
        recipients.length * 350 - (startedAt ? Date.now() - startedAt : 0)
      )
    : 0;
  const etaLabel = sending && startedAt ? `${Math.ceil(etaMs / 1000)}s remaining` : "";

  // rows to display (fixes TS error about r.error)
  const displayRows: RecipientRow[] = useMemo(
    () =>
      rows.length
        ? rows
        : recipients.map((id) => ({ id, status: "pending" as RowStatus })),
    [rows, recipients]
  );

  // ---- SEND NOW ----
  async function handleSendNow() {
    if (!hasChannel) return alert("Please select a channel.");
    if (!hasRecipients) return alert("Please add at least one Client ID.");
    if (!hasMessage) return;

    const payload: SendMessageRequest = {
      channel: channelMap[channel as Exclude<Channel, "">],
      content: message,
      recipients,
      subject: subject || undefined,
    };

    try {
      setSending(true);
      setStartedAt(Date.now());
      abortRef.current = false;
      setRows(
        recipients.map((id) => ({
          id,
          status: "pending" as RowStatus,
        }))
      );
      setProgress(0);

      // call backend (real send / queue)
      await http.post("/messaging/send", payload);

      // local progress simulation (UI only)
      for (let i = 0; i < recipients.length; i++) {
        if (abortRef.current) break;

        setRows((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: "sending" };
          return copy;
        });

        await new Promise((res) =>
          setTimeout(res, 220 + Math.floor(Math.random() * 280))
        );

        if (abortRef.current) break;

        const fail = false; // no random failure now
        setRows((prev) => {
          const copy = [...prev];
          copy[i] = fail
            ? { ...copy[i], status: "error", error: "Failed" }
            : { ...copy[i], status: "success" };
          return copy;
        });

        setProgress(Math.round(((i + 1) / recipients.length) * 100));
      }

      if (!abortRef.current) {
        setMessage("");
        // keep subject so user can reuse
        loadRecent();
      }
    } catch (e: any) {
      alert(e?.message || "Failed to send messages.");
    } finally {
      setSending(false);
      abortRef.current = false;
      setStartedAt(null);
    }
  }

  async function handleSchedule() {
    if (!hasChannel) return alert("Please select a channel.");
    if (!hasRecipients) return alert("Please add at least one Client ID.");
    if (!hasMessage) return;
    if (!scheduleDate || !scheduleTime)
      return alert("Please select schedule date & time.");

    const scheduledFor = `${scheduleDate}T${scheduleTime}`;

    const payload: ScheduleMessageRequest = {
      channel: channelMap[channel as Exclude<Channel, "">],
      content: message,
      recipients,
      subject: subject || undefined,
      scheduledFor,
    };

    try {
      await http.post("/messaging/schedule", payload);
      alert(
        `Message scheduled via ${
          channelMap[channel as Exclude<Channel, "">]
        } on ${scheduleDate} ${scheduleTime}.`
      );
      setScheduleDate("");
      setScheduleTime("");
    } catch (e: any) {
      alert(e?.message || "Failed to schedule message.");
    }
  }

  function handleCancel() {
    abortRef.current = true;
    setSending(false);
    setStartedAt(null);
  }

  const total = displayRows.length || recipients.length;
  const sent = displayRows.filter((r) => r.status === "success").length;
  const failed = displayRows.filter((r) => r.status === "error").length;

  return (
    <div
      className={`flex flex-col gap-6 p-8 bg-white min-h-screen text-[#0C1D40] ${inter.className}`}
    >
      {/* Header */}
      <div>
        <h1
          className={`text-4xl font-extrabold tracking-wide uppercase ${anton.className}`}
        >
          Messaging
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Compose and send SMS / Gmail messages using Client IDs from Contacts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 cols: compose & status */}
        <div className="space-y-6 lg:col-span-2">
          {/* Compose card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <h2 className={`text-xl font-bold mb-4 ${anton.className}`}>
              Compose Message
            </h2>

            <div className="space-y-4">
              {/* Channel */}
              <div className="space-y-2">
                <Label className="text-[#0C1D40] font-medium">
                  Select Channel
                </Label>
                <RadioGroup value={channel} className="space-y-2">
                  {(["sms", "gmail", "both"] as Channel[]).map((c) => (
                    <div key={c} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={c}
                        id={c}
                        checked={channel === c}
                        onClick={() => setChannel(channel === c ? "" : c)}
                      />
                      <Label htmlFor={c} className="font-normal cursor-pointer">
                        {c === "sms"
                          ? "SMS"
                          : c === "gmail"
                          ? "Gmail"
                          : "Both (SMS + Gmail)"}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Email subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-[#0C1D40] font-medium">
                  Email Subject (for Gmail)
                </Label>
                <Input
                  id="subject"
                  placeholder="e.g. AINS Notification for your upcoming schedule"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#E8B86D]"
                />
                <p className="text-xs text-gray-500">
                  Used when channel is <strong>Gmail</strong> or{" "}
                  <strong>Both</strong>. Leave empty to use the system&apos;s
                  default subject.
                </p>
              </div>

              {/* Recipients from contacts */}
              <div className="space-y-2">
                <Label className="text-[#0C1D40] font-medium">
                  Recipients (from Contacts)
                </Label>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={addFromContactsId}
                    onChange={(e) => setAddFromContactsId(e.target.value)}
                    className="h-11 flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-[#E8B86D]"
                    disabled={loadingContacts || availableToAdd.length === 0}
                  >
                    <option value="">
                      {loadingContacts
                        ? "Loading contacts..."
                        : availableToAdd.length === 0
                        ? "No more contacts to add"
                        : "Select contact to add"}
                    </option>
                    {availableToAdd.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} • {c.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1"
                    onClick={addSelectedFromContacts}
                    disabled={!addFromContactsId}
                  >
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1"
                    onClick={addAllFromContacts}
                    disabled={availableToAdd.length === 0}
                  >
                    <Plus className="h-4 w-4" /> Add all
                  </Button>
                </div>

                {/* list of selected recipients */}
                <div className="max-h-40 overflow-auto rounded border border-gray-200 p-3 bg-gray-50">
                  {resolved.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      Use Contacts page (&ldquo;Use in Messaging&rdquo;) or add
                      clients above.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {resolved.map(({ id, contact }) => {
                        const emailMasked = contact?.email
                          ? maskEmail(contact.email)
                          : "";
                        const phoneMasked = contact?.phone
                          ? maskPhone(contact.phone)
                          : "";
                        const info =
                          emailMasked && phoneMasked
                            ? `${emailMasked} • ${phoneMasked}`
                            : emailMasked || phoneMasked || "No contact info";

                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between text-sm bg-white rounded-md px-2 py-1"
                          >
                            <div>
                              <span className="font-semibold mr-1">{id}</span>
                              {contact && (
                                <span className="text-gray-500">
                                  • {contact.name} • {info}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelected(id)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Manual IDs */}
              <div className="space-y-2">
                <Label htmlFor="manualIds" className="text-[#0C1D40] font-medium">
                  Additional Client IDs (comma-separated)
                </Label>
                <Input
                  id="manualIds"
                  placeholder="e.g. PPA-00001, PPA-00002"
                  value={manualRaw}
                  onChange={(e) => setManualRaw(e.target.value)}
                  className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#E8B86D]"
                />
              </div>

              {/* Message content */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-[#0C1D40] font-medium">
                  Message Content
                </Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[150px] resize-none rounded-lg border-gray-300 focus-visible:ring-2 focus-visible:ring-[#E8B86D] focus-visible:border-transparent"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Charset: {smsStats.charset} • Segments: {smsStats.segments} •
                    Limit/segment: {smsStats.limit}
                  </span>
                  <span>{smsStats.used} chars</span>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <Label className="text-[#0C1D40] font-medium">
                  Schedule (optional)
                </Label>
                <div className="flex gap-3 flex-wrap">
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="h-11 w-40 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#E8B86D]"
                  />
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="h-11 w-32 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#E8B86D]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 flex-wrap">
                <Button
                  onClick={handleSendNow}
                  disabled={!canSend}
                  className="gap-2 bg-[#E8B86D] hover:bg-[#d0a95f] text-[#0C1D40] font-semibold disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {sending ? "Sending..." : "Send Now"}
                </Button>

                <Button
                  onClick={handleSchedule}
                  disabled={!hasChannel || !hasMessage || !hasRecipients}
                  variant="outline"
                  className="gap-2 border-[#0C1D40] text-[#0C1D40] hover:bg-[#0C1D40] hover:text-white"
                >
                  <Clock className="h-4 w-4" />
                  Schedule Message
                </Button>

                {sending && (
                  <Button
                    onClick={handleCancel}
                    variant="ghost"
                    className="gap-2 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Progress & per-recipient statuses */}
          {(displayRows.length > 0 || sending) && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${anton.className}`}>
                  Sending Progress
                </h2>
                <div className="text-sm text-gray-600">
                  {sent} sent • {failed} failed • {total} total{" "}
                  {etaLabel ? `• ${etaLabel}` : ""}
                </div>
              </div>

              <div className="mb-4">
                <Progress value={progress} />
                <div className="text-xs text-gray-500 mt-1">{progress}%</div>
              </div>

              <div className="max-h-64 overflow-auto divide-y">
                {displayRows.map((r, i) => (
                  <div
                    key={`${r.id}-${i}`}
                    className="py-2 flex items-center justify-between"
                  >
                    <div className="text-sm font-medium">{r.id}</div>
                    <div className="flex items-center gap-2 text-sm">
                      {r.status === "pending" && (
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="h-4 w-4" /> Pending
                        </span>
                      )}
                      {r.status === "sending" && (
                        <span className="text-blue-600 flex items-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending
                        </span>
                      )}
                      {r.status === "success" && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Sent
                        </span>
                      )}
                      {r.status === "error" && (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />{" "}
                          {r.error || "Failed"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: recent messages (from backend) */}
        <div className="rounded-2xl border border-[#0C1D40] bg-[#0C1D40] p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold text-[#E8B86D] ${anton.className}`}>
              Recent Messages
            </h2>

            <Button
              type="button"
              variant="outline"
              onClick={handleClearRecent}
              disabled={recentLoading || recent.length === 0}
              className="border-[#E8B86D] text-[#E8B86D] hover:bg-[#E8B86D] hover:text-[#0C1D40]"
            >
              Clear All
            </Button>
          </div>

          {recentLoading ? (
            <div className="text-sm text-gray-200 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : recent.length === 0 ? (
            <div className="text-sm text-gray-300">
              No messages sent yet. Once you send messages, they will appear
              here.
            </div>
          ) : (
            <div className="space-y-4">
              {recent.map((msg) => (
                <div
                  key={msg.id}
                  className="border-b border-white/10 pb-3 last:border-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">
                      {msg.clientId || "Unknown client"} • {msg.channel}
                    </span>
                    <span className="text-xs text-gray-300">
                      {formatWhen(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 line-clamp-2">
                    {msg.content}
                  </p>
                  {msg.status && (
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Status: {msg.status}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
