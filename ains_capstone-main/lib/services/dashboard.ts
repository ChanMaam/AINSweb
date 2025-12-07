// lib/services/dashboard.ts
import { http } from "@/lib/http";

export type DashboardCounts = {
  scheduled: number;
  totalSent: number;
  receivedToday: number;
  failed: number;
};

export type ActivityItem = {
  time: string;
  action: string;
  status: "success" | "error" | "info";
};

export type SystemStatus = {
  gsmConnected: boolean;
  gsmSignal?: string | null;
  dbOk: boolean;
  queueStatus: string;
};

export type DashboardSummary = {
  counts: DashboardCounts;
  recent: ActivityItem[];
  system: SystemStatus;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return http.get("/dashboard/summary");
}
