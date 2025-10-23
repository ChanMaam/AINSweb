"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Clock, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Inter, Anton } from "next/font/google";
import { Progress } from "@/components/ui/progress";

import { http } from "@/lib/types/http";
import type { paths } from "@/lib/types/api";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const anton = Anton({ subsets: ["latin"], weight: ["400"] });

type Channel = "" | "sms" | "gmail" | "both";
const channelMap = { sms: "SMS", gmail: "Gmail", both: "Both" } as const;

type SendMessageRequest =
  paths["/messaging/send"]["post"]["requestBody"]["content"]["application/json"];

// ---- SMS segment helper (unchanged) ----
const GSM7_REGEX =
  /^[\n\r !\"#\$%&'\(\)\*\+,\-\.\/0-9:;<=>\?@A-Z_ÄÖÑÜ§¿a-zäöñüà£¥èéùìòÇØøÅåΔΦΓΛΩΠΨΣΘΞ^{}\\\[~\]|€]*$/;
function countSmsSegments(text: string) {
  if (!text) return { charset: "GSM-7", limit: 160, used: 0, segments: 0 };
  const isGsm7 = GSM7_REGEX.test(text);
  if (isGsm7) {
    if (text.length <= 160) return { charset: "GSM-7", limit: 160, used: text.length, segments: 1 };
    return { charset: "GSM-7", limit: 153, used: text.length, segments: Math.ceil(text.length / 153) };
  } else {
    if (text.length <= 70) return { charset: "UCS-2", limit: 70, used: text.length, segments: 1 };
    return { charset: "UCS-2", limit: 67, used: text.length, segments: Math.ceil(text.length / 67) };
  }
}

// ---- UI-safe Contact type (avoid OpenAPI unknowns) ----
type Contact = {
  id: string;
  assignedOfficer: string;
  status: "Active" | "Inactive";
  lastContact: string;
};

type RowStatus = "pending" | "sending" | "success" | "error";
interface RecipientRow {
  id: string;
  status: RowStatus;
  error?: string;
}

export default function MessagingPage() {
  // core fields
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<Channel>("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // officer/clients picker
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());

  // manual recipients (still supported)
  const [recipientsRaw, setRecipientsRaw] = useState("");

  // bulk progress
  const [rows, setRows] = useState<RecipientRow[]>([]);
  const [sending, setSending] = useState(false);
  const abortRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // fetch contacts once (DEFENSIVE NORMALIZATION)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingContacts(true);
        const res = await http.get("/contacts");
        if (!mounted) return;

        const raw = (res as any)?.data ?? res;
        const arr: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.contacts)
          ? raw.contacts
          : Array.isArray(raw?.items)
          ? raw.items
          : [];

        const rows: Contact[] = arr.map((r) => ({
          id: String(r?.id ?? ""),
          assignedOfficer: String(r?.assignedOfficer ?? ""),
          status: (r?.status === "Active" || r?.status === "Inactive" ? r.status : "Active") as
            | "Active"
            | "Inactive",
          lastContact: String(r?.lastContact ?? ""),
        }));

        setContacts(rows);
      } catch {
        setContacts([]); // keep it safe
      } finally {
        if (mounted) setLoadingContacts(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // --- derive officers and filtered clients (DEFENSIVE) ---
  const officers = useMemo(() => {
    const list = Array.isArray(contacts) ? contacts : [];
    return Array.from(new Set(list.map((c) => c.assignedOfficer))).sort();
  }, [contacts]);

  const clientsForOfficer = useMemo(() => {
    const list = Array.isArray(contacts) ? contacts : [];
    return selectedOfficer
      ? list.filter((c) => c.assignedOfficer === selectedOfficer)
      : list;
  }, [contacts, selectedOfficer]);

  // Select-all for current officer list
  const allIdsForOfficer = useMemo(
    () => clientsForOfficer.map((c) => c.id),
    [clientsForOfficer]
  );
  const allCheckedForOfficer =
    allIdsForOfficer.length > 0 &&
    allIdsForOfficer.every((id) => selectedClientIds.has(id));

  function toggleClient(id: string) {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (allCheckedForOfficer) {
        allIdsForOfficer.forEach((id) => next.delete(id));
      } else {
        allIdsForOfficer.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  // manual ids
  const manualIds = useMemo(
    () =>
      recipientsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [recipientsRaw]
  );

  // FINAL RECIPIENTS = selected (checkbox) ∪ manual
  const recipients = useMemo(() => {
    const set = new Set<string>([...selectedClientIds, ...manualIds]);
    return Array.from(set);
  }, [selectedClientIds, manualIds]);

  // validations
  const smsStats = useMemo(() => countSmsSegments(message), [message]);
  const hasChannel = !!channel;
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
  const etaLabel =
    sending && startedAt ? `${Math.ceil(etaMs / 1000)}s remaining` : "";

  async function handleSendNow() {
    if (!hasChannel) return alert("Please select a channel");
    if (!hasRecipients) return alert("Please choose clients or enter Client IDs");
    if (!hasMessage) return;

    try {
      setSending(true);
      setStartedAt(Date.now());
      abortRef.current = false;

      const payload: SendMessageRequest = {
        channel: channelMap[channel],
        content: message,
        recipients, // ✅ combined list
      };
      await http.post("/messaging/send", payload);

      // simulate per-recipient progress locally
      const initialRows: RecipientRow[] = recipients.map((id) => ({
        id,
        status: "pending",
      }));
      setRows(initialRows);
      setProgress(0);

      for (let i = 0; i < initialRows.length; i++) {
        if (abortRef.current) break;
        setRows((r) => {
          const copy = [...r];
          copy[i] = { ...copy[i], status: "sending" };
          return copy;
        });
        await new Promise((res) =>
          setTimeout(res, 220 + Math.floor(Math.random() * 280))
        );
        if (abortRef.current) break;
        const fail = Math.random() < 0.08;
        setRows((r) => {
          const copy = [...r];
          copy[i] = fail
            ? { ...copy[i], status: "error", error: "Network timeout" }
            : { ...copy[i], status: "success" };
          return copy;
        });
        setProgress(Math.round(((i + 1) / initialRows.length) * 100));
      }

      if (!abortRef.current) setMessage("");
    } catch (e: any) {
      alert(e?.message || "Failed to start bulk send");
    } finally {
      setSending(false);
      abortRef.current = false;
      setStartedAt(null);
    }
  }

  function handleCancel() {
    abortRef.current = true;
    setSending(false);
    setStartedAt(null);
  }

  function handleSchedule() {
    if (!hasChannel) return alert("Please select a channel");
    if (!hasRecipients) return alert("Please choose clients or enter Client IDs");
    if (!scheduleDate || !scheduleTime)
      return alert("Please select date and time");
    if (!hasMessage) return;
    alert(
      `Message scheduled via ${channelMap[channel]} on ${scheduleDate} ${scheduleTime} (mock scheduler)`
    );
  }

  const total = rows.length || recipients.length;
  const sent = rows.filter((r) => r.status === "success").length;
  const failed = rows.filter((r) => r.status === "error").length;

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
          Compose and send SMS/Gmail messages to clients
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: compose & recipients */}
        <div className="space-y-6 lg:col-span-2">
          {/* Compose card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <h2 className={`text-xl font-bold mb-4 ${anton.className}`}>
              Compose Message
            </h2>

            <div className="space-y-4">
              {/* Channel */}
              <div className="space-y-3">
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

              {/* OFFICER + CLIENTS PICKER */}
              <div className="space-y-2">
                <Label className="text-[#0C1D40] font-medium">
                  Recipients by Officer
                </Label>

                {/* Officer select */}
                <div className="flex items-center gap-3">
                  <select
                    value={selectedOfficer}
                    onChange={(e) => {
                      setSelectedOfficer(e.target.value);
                      // keep existing manual selections
                    }}
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-[#E8B86D]"
                  >
                    <option value="">
                      {loadingContacts ? "Loading officers..." : "All Officers"}
                    </option>
                    {officers.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    className="whitespace-nowrap"
                    onClick={toggleSelectAll}
                    disabled={clientsForOfficer.length === 0}
                  >
                    {allCheckedForOfficer ? "Unselect All" : "Select All"}
                  </Button>
                </div>

                {/* Clients list (checkboxes) */}
                <div className="max-h-40 overflow-auto rounded border border-gray-200 p-3">
                  {clientsForOfficer.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No clients{" "}
                      {selectedOfficer ? `for ${selectedOfficer}` : "available"}.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {clientsForOfficer.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={selectedClientIds.has(c.id)}
                            onChange={() => toggleClient(c.id)}
                          />
                          <span className="font-medium">{c.id}</span>
                          <span className="text-gray-500">
                            • {c.assignedOfficer}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Checked clients will be included. You can still add manual
                  Client IDs below.
                </div>
              </div>

              {/* Manual Client IDs (kept) */}
              <div className="space-y-2">
                <Label htmlFor="recipients" className="text-[#0C1D40] font-medium">
                  Additional Client IDs (comma-separated)
                </Label>
                <Input
                  id="recipients"
                  placeholder="e.g. PPA-12345, PPA-67890"
                  value={recipientsRaw}
                  onChange={(e) => setRecipientsRaw(e.target.value)}
                  className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#E8B86D]"
                />
              </div>

              {/* Message */}
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

              {/* Actions */}
              <div className="flex gap-3 pt-2">
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
                  disabled={!hasMessage || !hasChannel || !hasRecipients}
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
          {(rows.length > 0 || sending) && (
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
                {(rows.length
                  ? rows
                  : recipients.map((id) => ({ id, status: "pending" as const }))
                ).map((r, i) => (
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

        {/* Right: sidebar (unchanged) */}
        <div className="rounded-2xl border border-[#0C1D40] bg-[#0C1D40] p-6 shadow-md">
          <h2
            className={`text-xl font-bold mb-4 text-[#E8B86D] ${anton.className}`}
          >
            Recent Messages
          </h2>
          <div className="space-y-4">
            {[
              {
                time: "10 min ago",
                recipient: "All Clients",
                preview: "Reminder: Court hearing tomorrow at 9 AM",
              },
              {
                time: "1 hour ago",
                recipient: "PPA-12345",
                preview: "Please confirm your attendance for...",
              },
              {
                time: "2 hours ago",
                recipient: "Officer Santos' Group",
                preview: "Monthly check-in scheduled for next week",
              },
              {
                time: "Yesterday",
                recipient: "Active Clients",
                preview: "Important: Update your contact information",
              },
            ].map((msg, index) => (
              <div key={index} className="border-b border-white/10 pb-3 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">
                    {msg.recipient}
                  </span>
                  <span className="text-xs text-gray-300">{msg.time}</span>
                </div>
                <p className="text-sm text-gray-200 line-clamp-2">
                  {msg.preview}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
