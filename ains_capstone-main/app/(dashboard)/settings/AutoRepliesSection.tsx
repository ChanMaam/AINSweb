"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { http } from "@/lib/types/http";
import type { components } from "@/lib/types/api";

// OpenAPI types
type Rule = components["schemas"]["Rule"];
type RulePartial = components["schemas"]["RulePartial"];

export default function AutoRepliesSection() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form (SMS only)
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [matchClientId, setMatchClientId] = useState("");
  const [matchContains, setMatchContains] = useState("");
  const [replyTemplate, setReplyTemplate] = useState(
    "Hello {{clientId}}, we received your message."
  );

  async function loadRules() {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get("/rules");
      setRules((res.data as Rule[]) ?? []);
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
    if (!id.trim() || !name.trim()) {
      alert("Rule ID and Name are required.");
      return;
    }

    // SMS only – channel is implicit on the backend
    const payload: Rule = {
      id: id.trim(),
      name: name.trim(),
      enabled,
      match: {
        clientId: matchClientId.trim() || undefined,
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
      setId("");
      setName("");
      setEnabled(true);
      setMatchClientId("");
      setMatchContains("");
      setReplyTemplate("Hello {{clientId}}, we received your message.");
    } catch (e: any) {
      alert(e?.message || "Failed to add rule");
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

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div>
        <h2 className="text-xl font-bold">Auto-Replies (Rules)</h2>
        <p className="text-sm text-gray-600">
          All rules here apply to <strong>SMS</strong> only. When a client sends an SMS
          that matches your conditions, the system replies automatically using the template below.
        </p>
      </div>

      {/* Create Rule */}
      <section className="rounded-xl border p-4 space-y-4 bg-white">
        <h3 className="font-semibold">Create New Rule</h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Rule ID</Label>
            <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. R1" />
          </div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Short rule name" />
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

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Match: Client ID (optional)</Label>
            <Input
              value={matchClientId}
              onChange={(e) => setMatchClientId(e.target.value)}
              placeholder="e.g. PPA-1111"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Match: Contains (text)</Label>
            <Input
              value={matchContains}
              onChange={(e) => setMatchContains(e.target.value)}
              placeholder='e.g. "attendance", "schedule"'
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Reply Template</Label>
          <Textarea
            value={replyTemplate}
            onChange={(e) => setReplyTemplate(e.target.value)}
            placeholder="Hello {{clientId}}, your attendance is noted."
          />
          <div className="text-xs text-gray-500">
            Supports variables: {"{{clientId}}"} • Replies are sent via <strong>SMS</strong>
          </div>
        </div>

        <div>
          <Button onClick={addRule} disabled={!id.trim() || !name.trim()}>
            Add Rule
          </Button>
        </div>
      </section>

      {/* Rules list */}
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
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading…</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No rules yet.</td></tr>
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
                    <div className="whitespace-pre-wrap">{r.reply?.template}</div>
                    <div className="text-xs text-gray-500 mt-1">Channel: SMS</div>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => toggleEnable(r)}>
                      {r.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteRule(r)}>
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
    if (rule.match?.clientId) p.push(`clientId=${rule.match.clientId}`);
    if (rule.match?.contains) p.push(`contains="${rule.match.contains}"`);
    return p;
  }, [rule]);

  return <div className="text-xs text-gray-700">{parts.length ? parts.join(" • ") : "Any"}</div>;
}
