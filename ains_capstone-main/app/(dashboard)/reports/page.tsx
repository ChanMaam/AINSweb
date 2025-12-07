"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Inter, Anton } from "next/font/google";
import { http } from "@/lib/http";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const anton = Anton({ subsets: ["latin"], weight: ["400"] });

type ReportSummary = {
  totalSent: number;
  deliveryRate: number;    // already in %
  autoReplyRate: number;   // already in %
  failedCount: number;
};

type FailedLog = {
  clientId: string;
  message: string;
  reason: string;
  timestamp: string;
};

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [failed, setFailed] = useState<FailedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- load data from backend ---
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, failedRes] = await Promise.all([
          http.get("/reports/summary"),
          http.get("/reports/failed"),
        ]);

        if (!mounted) return;
        setSummary(summaryRes as ReportSummary);
        setFailed(Array.isArray(failedRes) ? (failedRes as FailedLog[]) : []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load reports");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // --- Export Failed Logs as CSV ---
  const handleExportReport = () => {
    if (!failed.length) {
      alert("No failed messages to export yet.");
      return;
    }

    const headers = ["Client ID", "Message", "Failure Reason", "Timestamp"];

    const escape = (v: string) => {
      const s = v ?? "";
      if (/[",\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines = [
      headers.join(","),
      ...failed.map((row) =>
        [
          escape(row.clientId),
          escape(row.message),
          escape(row.reason),
          escape(row.timestamp),
        ].join(",")
      ),
    ];

    const csv = lines.join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ains_failed_messages_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalSentDisplay =
    summary?.totalSent != null
      ? summary.totalSent.toLocaleString()
      : loading
      ? "—"
      : "0";

  const deliveryRateDisplay =
    summary?.deliveryRate != null
      ? `${summary.deliveryRate.toFixed(1)}%`
      : loading
      ? "—"
      : "0%";

  const autoReplyRateDisplay =
    summary?.autoReplyRate != null
      ? `${summary.autoReplyRate.toFixed(1)}%`
      : loading
      ? "—"
      : "0%";

  const failedCountDisplay =
    summary?.failedCount != null
      ? summary.failedCount.toLocaleString()
      : loading
      ? "—"
      : "0";

  return (
    <div
      className={`flex flex-col gap-8 p-8 bg-white min-h-screen text-[#0C1D40] ${inter.className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-4xl font-extrabold tracking-wide uppercase ${anton.className}`}
          >
            Reports
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Analytics and message delivery logs
          </p>
        </div>
        <Button
          onClick={handleExportReport}
          className="gap-2 bg-[#E8B86D] hover:bg-[#d0a95f] text-[#0C1D40] font-semibold"
          disabled={loading}
        >
          <Download className="h-4 w-4" />
          Export Failed Logs
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="rounded-2xl shadow-md bg-[#0C1D40] text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#E8B86D]">
              Total Sent (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{totalSentDisplay}</div>
            <p className="text-xs mt-1 text-green-400">
              {/* placeholder trend */}
              {summary ? "+ compared to last month" : "\u00A0"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-[#0C1D40] text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#E8B86D]">
              Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">
              {deliveryRateDisplay}
            </div>
            <p className="text-xs mt-1 text-green-400">
              {/* trend placeholder */}
              {summary ? "of all messages this month" : "\u00A0"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-[#0C1D40] text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#E8B86D]">
              Auto-Reply Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">
              {autoReplyRateDisplay}
            </div>
            <p className="text-xs mt-1 text-gray-300">
              Of received messages
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-[#0C1D40] text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#E8B86D]">
              Failed Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">
              {failedCountDisplay}
            </div>
            <p className="text-xs mt-1 text-red-400">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className={`${anton.className} text-lg`}>
              Messages Sent per Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-sm text-gray-500">Chart visualization</p>
                <p className="text-xs text-gray-500 mt-1">
                  Weekly message statistics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className={`${anton.className} text-lg`}>
              Replies Received vs Auto-Replied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-sm text-gray-500">Chart visualization</p>
                <p className="text-xs text-gray-500 mt-1">
                  Monthly reply statistics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failed Messages Log */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className={`${anton.className} text-lg`}>
            Failed Message Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0C1D40] hover:bg-[#0C1D40]">
                  <TableHead className="text-white text-sm font-semibold">
                    Client ID
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold">
                    Message
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold">
                    Failure Reason
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-white text-sm font-semibold text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-gray-500"
                    >
                      Loading failed messages…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && failed.length === 0 && !error && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-gray-500"
                    >
                      No failed messages recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  failed.map((msg, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-[#0C1D40]">
                        {msg.clientId || "—"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-700">
                        {msg.message}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                          {msg.reason}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {msg.timestamp}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#0C1D40] hover:text-[#E8B86D]"
                          onClick={() =>
                            alert(
                              "Retry sending will be implemented later.\nFor now, please resend from the Messaging page."
                            )
                          }
                        >
                          Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
