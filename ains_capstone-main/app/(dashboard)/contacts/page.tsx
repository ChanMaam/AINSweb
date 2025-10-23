"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, X, RefreshCw, Upload, Download } from "lucide-react";

// ⬅️ Correct import: named export, correct folder (lib/http.ts)
import { http } from "@/lib/types/http";

// OpenAPI schema types
import type { components } from "@/lib/types/api";
type Contact = components["schemas"]["Contact"]; // { id, assignedOfficer, status, lastContact }

export default function ContactsPage() {
  // raw data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");                 // search (ID contains)
  const [officer, setOfficer] = useState("");     // exact match or "" (all)
  const [status, setStatus] = useState("");       // "Active" | "Inactive" | ""

  // selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // file input ref (hidden)
  const fileRef = useRef<HTMLInputElement | null>(null);

  // fetch (defensive normalization)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await http.get("/contacts");
        const raw = res?.data;

        const rows: Contact[] = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as any)?.contacts)
          ? (raw as any).contacts
          : Array.isArray((raw as any)?.items)
          ? (raw as any).items
          : [];

        if (mounted) setContacts(rows);
      } catch (e: any) {
        if (mounted) {
          setError(e?.message || "Failed to load contacts");
          setContacts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // --- derive officers and filtered rows (defensive) ---
  const officers = useMemo(() => {
    const list = Array.isArray(contacts) ? contacts : [];
    return Array.from(new Set(list.map((c) => c.assignedOfficer))).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    const list = Array.isArray(contacts) ? contacts : [];
    return list.filter((c) => {
      const byQ = q ? c.id.toLowerCase().includes(q.toLowerCase()) : true;
      const byOfficer = officer ? c.assignedOfficer === officer : true;
      const byStatus = status ? c.status === status : true;
      return byQ && byOfficer && byStatus;
    });
  }, [contacts, q, officer, status]);

  const allVisibleIds = useMemo(() => filtered.map((c) => c.id), [filtered]);
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        allVisibleIds.forEach((id) => next.delete(id));
      } else {
        allVisibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearFilters() {
    setQ("");
    setOfficer("");
    setStatus("");
  }

  function copySelected() {
    const list = Array.from(selected);
    if (list.length === 0) return;
    navigator.clipboard.writeText(list.join(", "));
    alert(`Copied ${list.length} Client ID(s) to clipboard.`);
  }

  // Save for Messaging to read later (optional integration)
  function useInMessaging() {
    const list = Array.from(selected);
    if (list.length === 0) {
      alert("Select at least one contact.");
      return;
    }
    localStorage.setItem("recipientsDraft", JSON.stringify(list));
    alert(`Saved ${list.length} recipient(s). Open Messaging to auto-fill.`);
  }

  /* =========================
     CSV: Template + Import
     ========================= */

  // Download a CSV template users can fill in Excel/Sheets
  function downloadTemplate() {
    const headers = ["id", "assignedOfficer", "status", "lastContact"];
    const sample = [
      ["PPA-12345", "Officer Santos", "Active", "2025-02-08"],
      ["PPA-67890", "Officer Reyes", "Inactive", "2025-01-25"],
    ];
    const csv =
      headers.join(",") +
      "\n" +
      sample
        .map((r) => r.map(escapeCsv).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Trigger hidden file input (Replace)
  function triggerFilePicker() {
    fileRef.current?.click();
  }

  // Parse + Import (Replace or Append)
  async function onPickFile(
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "replace" | "append"
  ) {
    const file = e.target.files?.[0];
    // reset input so user can pick same file twice
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const { rows, skipped, errors } = parseContactsCsv(text);
      if (rows.length === 0) {
        alert(
          `No valid rows found.${
            errors.length ? `\nErrors:\n- ${errors.slice(0, 5).join("\n- ")}` : ""
          }`
        );
        return;
      }

      if (mode === "replace") {
        setContacts(rows);
        setSelected(new Set());
      } else {
        // append/update by id (update if same id appears)
        const map = new Map<string, Contact>();
        contacts.forEach((c) => map.set(c.id, c));
        rows.forEach((r) => map.set(r.id, r));
        setContacts(Array.from(map.values()));
      }

      alert(
        `Imported ${rows.length} contact(s). Skipped ${skipped}.${
          errors.length
            ? `\nFirst issues:\n- ${errors.slice(0, 5).join("\n- ")}`
            : ""
        }`
      );
    } catch (err: any) {
      alert(`Failed to import CSV: ${err?.message || String(err)}`);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-gray-600">
            Manage clients, filter by officer/status, select sets for Messaging, or import from CSV (Excel-friendly).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={clearFilters} title="Reset filters">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={copySelected} disabled={selected.size === 0}>
            Copy Client IDs
          </Button>
          <Button
            onClick={useInMessaging}
            disabled={selected.size === 0}
            className="bg-[#E8B86D] text-[#0C1D40] hover:bg-[#d0a95f]"
          >
            Use in Messaging
          </Button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>

          {/* Hidden input for Replace mode */}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onPickFile(e, "replace")}
          />
          <Button variant="outline" onClick={triggerFilePicker}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV (Replace)
          </Button>

          {/* Append/Update mode (separate transient input for simplicity) */}
          <Button
            variant="outline"
            onClick={() => {
              const ok = confirm(
                "Append mode: existing IDs will be updated, new IDs added. Continue?"
              );
              if (!ok) return;
              const temp = document.createElement("input");
              temp.type = "file";
              temp.accept = ".csv,text/csv";
              temp.onchange = (ev: any) => onPickFile(ev, "append");
              temp.click();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV (Append/Update)
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="q">Search (Client ID)</Label>
          <Input
            id="q"
            placeholder="e.g. PPA-12345"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="officer">Officer</Label>
          <select
            id="officer"
            value={officer}
            onChange={(e) => setOfficer(e.target.value)}
            className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-[#E8B86D]"
          >
            <option value="">All officers</option>
            {officers.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-[#E8B86D]"
          >
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-3 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{contacts.length}</strong> contacts
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
            disabled={filtered.length === 0}
          >
            {allVisibleSelected ? (
              <>
                <X className="h-4 w-4 mr-2" /> Unselect all (filtered)
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" /> Select all (filtered)
              </>
            )}
          </Button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b">
              <th className="p-3 w-[52px] text-left">Sel</th>
              <th className="p-3 text-left">Client ID</th>
              <th className="p-3 text-left">Officer</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Last Contact</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  Loading contacts…
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No contacts match your filters.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selected.has(c.id)}
                      onChange={() => toggleRow(c.id)}
                    />
                  </td>
                  <td className="p-3 font-medium">{c.id}</td>
                  <td className="p-3">{c.assignedOfficer}</td>
                  <td className="p-3">{c.status}</td>
                  <td className="p-3">{c.lastContact}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Selected: <strong>{selected.size}</strong>
        </div>
        <div>
          Tip: Filter by officer, then use “Select all (filtered)” and “Use in Messaging” to prefill the Messaging page.
        </div>
      </div>
    </div>
  );
}

/* =========================
   CSV HELPERS (no libs)
   ========================= */

// Escape cell for CSV download (wrap quotes when needed)
function escapeCsv(v: string) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Parse CSV text into rows of Contact + validation
function parseContactsCsv(text: string): {
  rows: Contact[];
  skipped: number;
  errors: string[];
} {
  const errors: string[] = [];

  const lines = splitCsvLines(text);
  if (lines.length === 0) return { rows: [], skipped: 0, errors: ["Empty file"] };

  // Header row
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const map = headerMap(header);

  const required = ["id", "assignedOfficer", "status", "lastContact"];
  const missing = required.filter((k) => !map[k]);
  if (missing.length) {
    errors.push(`Missing required column(s): ${missing.join(", ")}`);
    return { rows: [], skipped: 0, errors };
  }

  let skipped = 0;
  const rows: Contact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = parseCsvLine(lines[i]);
    if (raw.every((c) => c.trim() === "")) {
      skipped++; // empty row
      continue;
    }
    const obj: any = {};
    for (let c = 0; c < header.length; c++) {
      const key = header[c]?.trim() || "";
      obj[key] = (raw[c] ?? "").trim();
    }

    const id = String(obj[map.id]).trim();
    const assignedOfficer = String(obj[map.assignedOfficer]).trim();
    let status = String(obj[map.status]).trim();
    const lastContact = String(obj[map.lastContact]).trim();

    if (!id || !assignedOfficer || !status) {
      skipped++;
      errors.push(`Row ${i + 1}: required fields missing`);
      continue;
    }

    // Normalize status
    if (/^active$/i.test(status)) status = "Active";
    else if (/^inactive$/i.test(status)) status = "Inactive";
    else {
      skipped++;
      errors.push(`Row ${i + 1}: invalid status "${status}" (use Active/Inactive)`);
      continue;
    }

    rows.push({ id, assignedOfficer, status, lastContact });
  }

  return { rows, skipped, errors };
}

// --- CSV parsing utilities (supports quoted commas and quotes) ---
function splitCsvLines(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i++;
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }
  if (cur.length) out.push(cur);
  return out;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === ",") {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }
  out.push(cur);
  return out;
}

// Build a case-insensitive map of required headers to their actual header names
function headerMap(headers: string[]): Record<string, string> {
  const candidates: Record<string, string[]> = {
    id: ["id", "clientid", "client_id", "client id", "ppa", "ppa_id"],
    assignedOfficer: [
      "assignedofficer",
      "officer",
      "assigned_officer",
      "assigned officer",
    ],
    status: ["status"],
    lastContact: [
      "lastcontact",
      "last_contact",
      "last contact",
      "last_contact_date",
      "lastcontactdate",
    ],
  };

  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  const map: Record<string, string> = {} as any;

  for (const key of Object.keys(candidates)) {
    for (const want of candidates[key]) {
      const idx = lowerHeaders.indexOf(want);
      if (idx >= 0) {
        map[key] = headers[idx]; // original header casing
        break;
      }
    }
  }
  return map;
}
