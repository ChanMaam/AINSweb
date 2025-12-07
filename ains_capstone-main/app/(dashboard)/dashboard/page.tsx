"use client";

import { useEffect, useState } from "react";
import { Calendar, Send, MessageCircle, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Inter, Anton } from "next/font/google";
import { http } from "@/lib/http";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const anton = Anton({ subsets: ["latin"], weight: ["400"] });

type DashboardCounts = {
  scheduled: number;
  totalSent: number; // all-time sent
  receivedToday: number;
  failed: number; // all-time failed
};

type GsmStatus = {
  connected?: boolean;
  signal?: string | number | null;
  port?: string | null;
  baud?: number | null;
  network?: string | null;
};

type RecentMessage = {
  id: number;
  clientId: string;
  channel: "SMS" | "Gmail" | "Both";
  content: string;
  createdAt: string;
  status?: string | null;
};

export default function DashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [countsError, setCountsError] = useState<string | null>(null);

  const [gsm, setGsm] = useState<GsmStatus | null>(null);
  const [gsmError, setGsmError] = useState<string | null>(null);

  const [recent, setRecent] = useState<RecentMessage[]>([]);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    // 1) dashboard summary (scheduled + totalSent + receivedToday + failed)
    (async () => {
      try {
        const data = await http.get("/dashboard/summary");
        const c = (data as any)?.counts;
        setCounts({
          scheduled: Number(c?.scheduled ?? 0),
          totalSent: Number(c?.totalSent ?? 0),
          receivedToday: Number(c?.receivedToday ?? 0),
          failed: Number(c?.failed ?? 0),
        });
        setCountsError(null);
      } catch (e: any) {
        setCounts(null);
        setCountsError(e?.message || "Failed to load dashboard summary");
      }
    })();

    // 2) GSM / system status
    (async () => {
      try {
        const data = await http.get("/settings/status");
        setGsm(data as GsmStatus);
        setGsmError(null);
      } catch (e: any) {
        setGsm(null);
        setGsmError(e?.message || "Failed to load GSM status");
      }
    })();

    // 3) recent messages
    (async () => {
      try {
        const raw = await http.get("/messaging/recent?limit=5");
        const arr: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
          ? raw.items
          : [];

        setRecent(
          arr.map((r, idx) => ({
            id: Number(r?.id ?? idx),
            clientId: String(r?.client_code ?? r?.clientId ?? ""),
            channel:
              r?.channel === "Gmail" || r?.channel === "Both"
                ? r.channel
                : "SMS",
            content: String(r?.content ?? ""),
            createdAt: String(r?.created_at ?? r?.createdAt ?? ""),
            status: r?.status ?? undefined,
          }))
        );
        setRecentError(null);
      } catch (e: any) {
        setRecent([]);
        setRecentError(e?.message || "Failed to load recent messages");
      }
    })();
  }, []);

  const totalScheduled = counts?.scheduled ?? 0;
  const totalSent = counts?.totalSent ?? 0;
  const messagesToday = counts?.receivedToday ?? 0;
  const failedCount = counts?.failed ?? 0;

  const attempts = totalSent + failedCount;

  const deliveryText =
    attempts > 0
      ? `${((totalSent * 100) / attempts).toFixed(1)}% delivery rate`
      : "Delivery rate: not enough data";

  const failedText =
    attempts > 0
      ? `${failedCount} failed out of ${attempts} attempts`
      : "No send attempts yet";

  const dbIsOk = countsError == null && counts != null;

  const gsmLabel =
    gsmError != null
      ? "Error"
      : gsm == null
      ? "Checking..."
      : gsm.connected
      ? "Connected"
      : "Disconnected";

  const gsmDotClass =
    gsmError != null
      ? "bg-red-400"
      : gsm == null
      ? "bg-yellow-400"
      : gsm.connected
      ? "bg-green-400"
      : "bg-red-400";

  function formatWhen(iso: string) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

  return (
    <div
      className={`flex min-h-screen flex-col gap-10 bg-white p-10 text-[#0C1D40] ${inter.className}`}
    >
      {/* Header */}
      <div className="text-center md:text-left">
        <h1
          className={`text-4xl font-extrabold tracking-wide text-[#0C1D40] uppercase ${anton.className}`}
        >
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 font-medium">
          Overview of SMS Messaging System
        </p>
        {countsError && (
          <p className="mt-2 text-sm text-red-600">{countsError}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Scheduled Messages"
          value={totalScheduled.toString()}
          icon={<Calendar className="h-5 w-5 text-[#E8B86D]" />}
          description="Messages pending delivery"
          trend={{
            value:
              totalScheduled > 0 ? "Scheduler active" : "No scheduled messages",
            isPositive: true,
          }}
          className="bg-[#0C1D40] rounded-2xl p-6 shadow-md border-none"
          tone="dark"
        />

        <StatCard
          title="Total Sent Messages"
          value={totalSent.toString()}
          icon={<Send className="h-5 w-5 text-[#E8B86D]" />}
          description="Successfully delivered (all time)"
          trend={{
            value: deliveryText,
            isPositive: attempts > 0 ? (totalSent * 100) / attempts >= 90 : true,
          }}
          className="bg-[#0C1D40] rounded-2xl p-6 shadow-md border-none"
          tone="dark"
        />

        <StatCard
          title="Messages Received Today"
          value={messagesToday.toString()}
          icon={<MessageCircle className="h-5 w-5 text-[#E8B86D]" />}
          description="Client responses in the last 24 hours"
          trend={{
            value:
              messagesToday > 0
                ? "Clients have replied today"
                : "No client responses today",
            isPositive: messagesToday > 0,
          }}
          className="bg-[#0C1D40] rounded-2xl p-6 shadow-md border-none"
          tone="dark"
        />

        <StatCard
          title="Failed/Undelivered"
          value={failedCount.toString()}
          icon={<AlertCircle className="h-5 w-5 text-[#E8B86D]" />}
          description="Messages that did not send successfully"
          trend={{
            value: failedText,
            isPositive: failedCount === 0,
          }}
          className="bg-[#0C1D40] rounded-2xl p-6 shadow-md border-none"
          tone="dark"
        />
      </div>

      {/* Recent Activity + System Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl bg-[#0C1D40] border border-[#0C1D40] p-6 shadow-md">
          <h3
            className={`text-xl font-bold text-[#E8B86D] mb-4 ${anton.className}`}
          >
            Recent Activity
          </h3>

          {recentError && (
            <p className="text-sm text-red-300 mb-2">{recentError}</p>
          )}

          <div className="space-y-4">
            {recent.length === 0 && !recentError && (
              <p className="text-sm text-gray-300">
                No messages logged yet. Once you send messages, activity will
                appear here.
              </p>
            )}

            {recent.map((m) => {
              const ok =
                !m.status ||
                m.status.toLowerCase() === "sent" ||
                m.status === "success";
              const dotClass = ok ? "bg-green-400" : "bg-red-400";

              return (
                <div key={m.id} className="flex items-start gap-3 text-sm">
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full ${dotClass}`} />
                  <div className="flex-1">
                    <p className="text-white">
                      Message via {m.channel} to {m.clientId || "Unknown client"}
                    </p>
                    <p className="text-xs text-gray-300">
                      {formatWhen(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-2xl bg-[#0C1D40] border border-[#0C1D40] p-6 shadow-md">
          <h3
            className={`text-xl font-bold text-[#E8B86D] mb-4 ${anton.className}`}
          >
            System Status
          </h3>

          <div className="space-y-5 text-sm">
            {/* GSM module */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300">GSM Module</span>
              <span className="flex items-center gap-2 font-medium text-white">
                <span className={`h-2.5 w-2.5 rounded-full ${gsmDotClass}`} />
                {gsmLabel}
              </span>
            </div>

            {/* Database */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Database</span>
              <span className="flex items-center gap-2 font-medium text-white">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    dbIsOk ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                {dbIsOk ? "Operational" : "Error"}
              </span>
            </div>

            {/* Message queue */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Message Queue</span>
              <span className="flex items-center gap-2 font-medium text-white">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    totalScheduled > 0 ? "bg-yellow-400" : "bg-green-400"
                  }`}
                />
                {totalScheduled > 0 ? "Active" : "Idle"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 mt-10">
        © 2025 AINS - All Rights Reserved | Parole and Probation Administration of
        Misamis Oriental
      </footer>
    </div>
  );
}
