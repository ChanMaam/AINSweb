"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { http } from "@/lib/http";
import type { components } from "@/lib/types/api";

// OpenAPI types
type Rule = components["schemas"]["Rule"];
type RulePartial = components["schemas"]["RulePartial"];

type OfficerRow = {
  officerName: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  timeFrom: string; // HH:MM
  timeTo: string;   // HH:MM
};

function getNextRuleId(existing: Rule[]): string {
  let max = 0;
  for (const r of existing) {
    const m = String(r.id || "").match(/^R(\d+)$/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n)) max = Math.max(max, n);
    }
  }
  return `R${max + 1}`;
}

function niceDate(d: string) {
  // keep it simple; if empty return blank
  return d || "";
}

function niceTime(t: string) {
  return t || "";
}

export default function AutoRepliesSection() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form (SMS only)
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [matchContains, setMatchContains] = useState("");
  const [replyTemplate, setReplyTemplate] = useState(
    "Hello {{clientId}}, we received your message."
  );

  // Officer Schedule section (2 officers)
  const [scheduleMatchContains, setScheduleMatchContains] = useState("");
  const [scheduleRows, setScheduleRows] = useState<OfficerRow[]>([
    { officerName: "", dateFrom: "", dateTo: "", timeFrom: "", timeTo: "" },
    { officerName: "", dateFrom: "", dateTo: "", timeFrom: "", timeTo: "" },
  ]);

  async function loadRules() {
    setLoading(true);
    setError(null);
    try {
      const data = await http.get("/rules");
      setRules((data as Rule[]) ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load rules");
      setRules([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function addRule() {
    if (!name.trim()) {
      alert("Rule Name is required.");
      return;
    }

    const autoId = getNextRuleId(rules);

    const payload: Rule = {
      id: autoId,
      name: name.trim(),
      enabled,
      match: {
        contains: matchContains.trim() || undefined,
      },
      reply: {
        template: replyTemplate.trim(),
      },
    };

    try {
      await http.post("/rules", payload);
      await loadRules();

      // reset
      setName("");
      setEnabled(true);
      setMatchContains("");
      setReplyTemplate("Hello {{clientId}}, we received your message.");
    } catch (e: any) {
      alert(e?.message || "Failed to add rule");
    }
  }

  const scheduleReplyPreview = useMemo(() => {
    const lines: string[] = [];

    for (const row of scheduleRows) {
      const n = row.officerName.trim();
      const df = niceDate(row.dateFrom);
      const dt = niceDate(row.dateTo);
      const tf = niceTime(row.timeFrom);
      const tt = niceTime(row.timeTo);

      if (!n && !df && !dt && !tf && !tt) continue;

      // Example output like:
      // Mrs. Jana 2025-12-01 to 2025-12-05 18:00 to 20:00
      const parts: string[] = [];
      if (n) parts.push(n);
      if (df || dt) parts.push(`${df || "?"} to ${dt || "?"}`);
      if (tf || tt) parts.push(`${tf || "?"} to ${tt || "?"}`);

      lines.push(parts.join(" "));
    }

    if (lines.length === 0) return "";
    return lines.join("\n");
  }, [scheduleRows]);

  async function addOfficerScheduleRule() {
    if (!scheduleMatchContains.trim()) {
      alert('Match Contains is required (e.g. "schedule", "appointment", etc.).');
      return;
    }
    if (!scheduleReplyPreview.trim()) {
      alert("Please fill up at least one officer schedule row.");
      return;
    }

    const autoId = getNextRuleId(rules);

    const payload: Rule = {
      id: autoId,
      name: "Officer Schedule",
      enabled: true,
      match: {
        contains: scheduleMatchContains.trim(),
      },
      reply: {
        template: scheduleReplyPreview.trim(),
      },
    };

    try {
      await http.post("/rules", payload);
      await loadRules();

      // reset schedule section
      setScheduleMatchContains("");
      setScheduleRows([
        { officerName: "", dateFrom: "", dateTo: "", timeFrom: "", timeTo: "" },
        { officerName: "", dateFrom: "", dateTo: "", timeFrom: "", timeTo: "" },
      ]);

      alert("Officer Schedule rule added.");
    } catch (e: any) {
      alert(e?.message || "Failed to add officer schedule rule");
    }
  }

  async function toggleEnable(r: Rule) {
    try {
      const patch: RulePartial = { enabled: !r.enabled };
      await http.patch(`/rules/${r.id}`, patch);
      await loadRules();
    } catch (e: any) {
      alert(e?.message || "Failed to update rule");
    }
  }

  async function deleteRule(r: Rule) {
    if (!confirm(`Delete rule "${r.name}"?`)) return;
    try {
      await http.delete(`/rules/${r.id}`);
      await loadRules();
    } catch (e: any) {
      alert(e?.message || "Failed to delete rule");
    }
  }

  function updateRow(idx: number, patch: Partial<OfficerRow>) {
    setScheduleRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div>
        <h2 className="text-xl font-bold">Auto-Replies (Rules)</h2>
      </div>

      {/* Create Rule (generic) */}
      <section className="rounded-xl border p-4 space-y-4 bg-white">
        <h3 className="font-semibold">Create New Rule</h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Short rule name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <select
              className="h-10 rounded-md border px-3 text-sm"
              value={enabled ? "true" : "false"}
              onChange={(e) => setEnabled(e.target.value === "true")}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>

        {/* Match: Contains ONLY */}
        <div className="space-y-1.5">
          <Label>Match: Contains (text)</Label>
          <Input
            value={matchContains}
            onChange={(e) => setMatchContains(e.target.value)}
            placeholder='e.g. "attendance", "schedule"'
          />
        </div>

        <div className="space-y-1.5">
          <Label>Reply Template</Label>
          <Textarea
            value={replyTemplate}
            onChange={(e) => setReplyTemplate(e.target.value)}
            placeholder="Hello {{clientId}}, your attendance is noted."
          />
          <div className="text-xs text-gray-500">
            Supports variables: {"{{clientId}}"} • Replies are sent via{" "}
            <strong>SMS</strong>
          </div>
        </div>

        <div>
          <Button
            onClick={addRule}
            disabled={!name.trim()}
            className="bg-[#E8B86D] hover:bg-[#d0a95f] text-[#0C1D40] font-semibold"
          >
            Add rule
          </Button>
          <div className="text-xs text-gray-500 mt-2">
            Rule ID is auto-generated (R1, R2, R3…).
          </div>
        </div>
      </section>

      {/* Officer Schedule (below auto reply section) */}
      <section className="rounded-xl border p-4 space-y-4 bg-white">
        <h3 className="font-semibold">Officer Schedule</h3>

        {/* One Match Contains ONLY (not per officer) */}
        <div className="space-y-1.5">
          <Label>Match: Contains (one keyword/phrase)</Label>
          <Input
            value={scheduleMatchContains}
            onChange={(e) => setScheduleMatchContains(e.target.value)}
            placeholder='e.g. "schedule", "appointment", "available"'
          />
          <div className="text-xs text-gray-500">
            When an incoming SMS contains this text, the schedule reply will be sent.
          </div>
        </div>

        {/* Two officer rows */}
        <div className="grid gap-3">
          {scheduleRows.map((row, idx) => (
            <div
              key={idx}
              className="grid gap-3 md:grid-cols-5 items-end rounded-lg border p-3"
            >
              <div className="space-y-1.5 md:col-span-1">
                <Label>Name</Label>
                <Input
                  value={row.officerName}
                  onChange={(e) => updateRow(idx, { officerName: e.target.value })}
                  placeholder={idx === 0 ? "Officer 1" : "Officer 2"}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={row.dateFrom}
                  onChange={(e) => updateRow(idx, { dateFrom: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>To</Label>
                <Input
                  type="date"
                  value={row.dateTo}
                  onChange={(e) => updateRow(idx, { dateTo: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Time From</Label>
                <Input
                  type="time"
                  value={row.timeFrom}
                  onChange={(e) => updateRow(idx, { timeFrom: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>To</Label>
                <Input
                  type="time"
                  value={row.timeTo}
                  onChange={(e) => updateRow(idx, { timeTo: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="space-y-1.5">
          <Label>Auto-reply text (preview)</Label>
          <Textarea value={scheduleReplyPreview} readOnly />
          <div className="text-xs text-gray-500">
            This is exactly what will be saved as the SMS reply text.
          </div>
        </div>

        <div>
          <Button
            onClick={addOfficerScheduleRule}
            className="bg-[#E8B86D] hover:bg-[#d0a95f] text-[#0C1D40] font-semibold"
          >
            Add rule
          </Button>
        </div>
      </section>

      {/* Rules list (now BELOW the 2 officer rows / section) */}
      <section className="rounded-xl border overflow-hidden bg-white">
        <div className="bg-gray-50 p-3 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {loading ? "Loading rules…" : `Total rules: ${rules.length}`}
            {error ? <span className="text-red-600 ml-2">• {error}</span> : null}
          </div>
          <Button variant="outline" size="sm" onClick={loadRules}>
            Refresh
          </Button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Enabled</th>
              <th className="p-3 text-left">Match</th>
              <th className="p-3 text-left">Reply</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No rules yet.
                </td>
              </tr>
            ) : (
              rules.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3 font-mono">{r.id}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.enabled ? "Yes" : "No"}</td>
                  <td className="p-3">
                    <MatchBadge rule={r} />
                  </td>
                  <td className="p-3">
                    <div className="whitespace-pre-wrap">
                      {r.reply?.template}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Channel: SMS</div>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleEnable(r)}
                    >
                      {r.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteRule(r)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function MatchBadge({ rule }: { rule: Rule }) {
  const parts = useMemo(() => {
    const p: string[] = [];
    // keep showing clientId if older rules have it
    if (rule.match?.clientId) p.push(`clientId=${rule.match.clientId}`);
    if (rule.match?.contains) p.push(`contains="${rule.match.contains}"`);
    return p;
  }, [rule]);

  return (
    <div className="text-xs text-gray-700">
      {parts.length ? parts.join(" • ") : "Any"}
    </div>
  );
}
