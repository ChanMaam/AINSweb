"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter, Anton } from "next/font/google";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Check,
  X,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  Plus,
} from "lucide-react";

import {
  listContacts,
  upsertContacts,
  replaceContacts,
  createContact,
  deleteContact,
  type Contact,
} from "@/lib/services/contacts";

/* =========================
   FONTS
   ========================= */

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const anton = Anton({ subsets: ["latin"], weight: ["400"] });

/* =========================
   MASK HELPERS (display only)
   ========================= */

function maskEmail(email?: string | null): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email; // not a normal email, just show it

  // keep last up to 6 chars of local part
  const visible = Math.min(6, local.length);
  const hiddenCount = Math.max(0, local.length - visible);

  return `${"*".repeat(hiddenCount)}${local.slice(-visible)}@${domain}`;
}

function maskPhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return phone;

  if (digits.length <= 4) {
    // too short to mask meaningfully
    return digits;
  }

  const last4 = digits.slice(-4);
  const hidden = "*".repeat(digits.length - 4);

  const hasPlus = phone.trim().startsWith("+");
  const prefix = hasPlus ? "+" : "";

  return prefix + hidden + last4;
}

export default function ContactsPage() {
  const router = useRouter();

  // data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState(""); // search by ID
  const [nameSearch, setNameSearch] = useState(""); // search by name

  // selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // manual add form
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // hidden file input
  const fileRef = useRef<HTMLInputElement | null>(null);

  // central loader
  async function load() {
    try {
      setLoading(true);
      setError(null);
      const rows = await listContacts();
      setContacts(rows);
    } catch (e: any) {
      setError(e?.message || "Failed to load contacts");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const list = Array.isArray(contacts) ? contacts : [];
    return list.filter((c) => {
      const byQ = q ? c.id.toLowerCase().includes(q.toLowerCase()) : true;
      const byName = nameSearch
        ? c.name.toLowerCase().includes(nameSearch.toLowerCase())
        : true;
      return byQ && byName;
    });
  }, [contacts, q, nameSearch]);

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

  function copySelected() {
    const list = Array.from(selected);
    if (list.length === 0) return;
    navigator.clipboard.writeText(list.join(", "));
    alert(`Copied ${list.length} Client ID(s) to clipboard.`);
  }

  // Save for Messaging to read later + NAVIGATE
  function useInMessaging() {
    const list = Array.from(selected);
    if (list.length === 0) {
      alert("Select at least one contact.");
      return;
    }
    localStorage.setItem("recipientsDraft", JSON.stringify(list));
    router.push("/messaging");
  }

  /* =========================
     MANUAL ADD / DELETE
     ========================= */

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    const email = newEmail.trim();
    const phone = newPhone.trim();
    const id = newId.trim();

    if (!name || !email) {
      alert("Client Name and Email are required");
      return;
    }

    try {
      setLoading(true);
      await createContact({
        id: id || undefined, // let backend auto-generate if blank
        name,
        email,
        phone: phone || undefined,
      });
      setNewId("");
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      await load();
      alert("Contact saved.");
    } catch (err: any) {
      alert(err?.message || "Failed to save contact");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteContact(id: string) {
    const ok = confirm(`Delete contact ${id}? This cannot be undone.`);
    if (!ok) return;

    try {
      setLoading(true);
      await deleteContact(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await load();
    } catch (err: any) {
      alert(err?.message || "Failed to delete contact");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    const ok = confirm(
      `Delete ${ids.length} selected contact(s)? This cannot be undone.`
    );
    if (!ok) return;

    try {
      setLoading(true);
      for (const id of ids) {
        try {
          await deleteContact(id);
        } catch {
          // ignore individual failures, we'll reload anyway
        }
      }
      setSelected(new Set());
      await load();
    } catch (err: any) {
      alert(err?.message || "Failed to delete selected contacts");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     CSV: Template + Import
     ========================= */

  // Download an EMPTY template (just headers)
  function downloadTemplate() {
    const headers = ["id", "clientName", "email", "phone"];
    const csv = headers.join(",") + "\n";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // confirmation before "Replace" import
  function triggerFilePicker() {
    const ok = confirm(
      "Replace mode will remove all existing contacts and replace them with the contacts from your CSV file.\n\nThis cannot be undone.\n\nDo you want to continue?"
    );
    if (!ok) return;
    fileRef.current?.click();
  }

  // Parse + Import (Replace or Append) — calls backend then reloads
  async function onPickFile(
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "replace" | "append"
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const { rows: parsedRows, skipped, errors } = parseContactsCsv(text);

      if (parsedRows.length === 0) {
        alert(
          `No valid rows found.${
            errors.length
              ? `\nErrors:\n- ${errors.slice(0, 5).join("\n- ")}`
              : ""
          }`
        );
        return;
      }

      // 🔹 Auto-fill missing Client IDs
      const rowsWithIds = autoFillClientIds(contacts, parsedRows);

      setLoading(true);
      if (mode === "replace") {
        await replaceContacts(rowsWithIds);
        setSelected(new Set());
      } else {
        await upsertContacts(rowsWithIds);
      }
      await load();

      alert(
        `Imported ${rowsWithIds.length} contact(s). Skipped ${skipped}.${
          errors.length
            ? `\nFirst issues:\n- ${errors.slice(0, 5).join("\n- ")}`
            : ""
        }`
      );
    } catch (err: any) {
      setLoading(false);
      alert(`Failed to import CSV: ${err?.message || String(err)}`);
    }
  }

  return (
    <div className={`p-6 space-y-6 ${inter.className}`}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1
            className={`text-2xl font-bold tracking-tight uppercase ${anton.className}`}
          >
            Contacts
          </h1>
          <p className="text-sm text-gray-600">
            Manage clients, keep email & phone numbers updated, and send groups
            to Messaging.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Reset button removed as requested */}

          <Button onClick={copySelected} disabled={selected.size === 0 || loading}>
            Copy Client IDs
          </Button>
          <Button
            onClick={useInMessaging}
            disabled={selected.size === 0 || loading}
            className="bg-[#E8B86D] text-[#0C1D40] hover:bg-[#d0a95f]"
          >
            Use in Messaging
          </Button>

          <Button
            variant="outline"
            onClick={handleDeleteSelected}
            disabled={selected.size === 0 || loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete selected
          </Button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <Button variant="outline" onClick={downloadTemplate} disabled={loading}>
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
          <Button variant="outline" onClick={triggerFilePicker} disabled={loading}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV (Replace)
          </Button>

          {/* Append/Update mode */}
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              const ok = confirm(
                "Append mode will add new contacts and update existing ones by Client ID.\n\nExisting contacts will NOT be removed.\n\nContinue?"
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

          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
        </div>
      </div>

      {/* Filters + Manual Add */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Filters */}
        <div className="space-y-3 lg:col-span-1">
          <div className="space-y-1.5">
            <Label htmlFor="q">Search (Client ID)</Label>
            <Input
              id="q"
              placeholder="e.g. PPA-12345"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nameSearch">Search (Name)</Label>
            <Input
              id="nameSearch"
              placeholder="e.g. Juan Dela Cruz"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Manual add contact form */}
        <div className="space-y-3 lg:col-span-2 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Plus className="h-4 w-4" />
            Add Contact Manually
          </div>
          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={handleAddContact}
          >
            <div className="space-y-1.5">
              <Label htmlFor="newId">Client ID (optional)</Label>
              <Input
                id="newId"
                placeholder="Leave blank for auto ID"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newName">Client Name *</Label>
              <Input
                id="newName"
                placeholder="Juan Dela Cruz"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newEmail">Email Address *</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="client@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPhone">Phone Number</Label>
              <Input
                id="newPhone"
                placeholder="+63917xxxxxxx"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="md:col-span-4 flex justify-end pt-1">
              <Button
                type="submit"
                disabled={loading || !newName.trim() || !newEmail.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Save Contact
              </Button>
            </div>
          </form>
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
            disabled={filtered.length === 0 || loading}
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
              <th className="p-3 text-left">Client Name</th>
              <th className="p-3 text-left">Email Address</th>
              <th className="p-3 text-left">Phone Number</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Loading contacts…
                </td>
              </tr>
            )}

            {error && !loading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No contacts yet. Import a CSV or add a contact manually above.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              contacts.length > 0 &&
              filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
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
                      disabled={loading}
                    />
                  </td>
                  <td className="p-3 font-medium">{c.id}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{maskEmail(c.email)}</td>
                  <td className="p-3">{maskPhone(c.phone)}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteContact(c.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </td>
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
          Tip: Use the search fields to narrow down clients, then use “Select all
          (filtered)” and “Use in Messaging” to prefill the Messaging page.
        </div>
      </div>
    </div>
  );
}

/* =========================
   CSV HELPERS
   ========================= */

function escapeCsv(v: string) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

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

  const required = ["clientName", "email"]; // id is OPTIONAL, phone optional
  const missing = required.filter((k) => !map[k]);
  if (missing.length) {
    errors.push(
      `Missing required column(s): ${missing
        .map((k) =>
          k === "clientName" ? "clientName / Client Name" : k === "email" ? "email" : k
        )
        .join(", ")}`
    );
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

    const id = (map.id ? String(obj[map.id]).trim() : "") || "";
    const clientName = String(obj[map.clientName]).trim();
    const email = String(obj[map.email]).trim();
    const phone = map.phone ? String(obj[map.phone]).trim() : "";

    if (!clientName || !email) {
      skipped++;
      errors.push(`Row ${i + 1}: Client Name and Email Address are required`);
      continue;
    }

    rows.push({ id, name: clientName, email, phone });
  }

  return { rows, skipped, errors };
}

// CSV parsing utilities (supports quoted commas and quotes)
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

// Build a case-insensitive map of headers to our keys
function headerMap(headers: string[]): Record<string, string> {
  const candidates: Record<string, string[]> = {
    id: ["id", "clientid", "client_id", "client id", "ppa", "ppa_id"],
    clientName: [
      "clientname",
      "client_name",
      "client name",
      "name",
      "full name",
    ],
    email: ["email", "emailaddress", "email address"],
    phone: [
      "phone",
      "phonenumber",
      "phone number",
      "contact",
      "contact number",
      "mobile",
      "mobile number",
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

/* =========================
   AUTO ID GENERATION
   ========================= */

function autoFillClientIds(existing: Contact[], rows: Contact[]): Contact[] {
  // find max numeric part from existing + rows that already have IDs
  let max = 0;

  const all = [...existing, ...rows];
  for (const r of all) {
    const n = extractIdNumber(r.id);
    if (n > max) max = n;
  }

  return rows.map((r) => {
    let id = r.id?.trim();
    if (!id) {
      max += 1;
      id = `PPA-${String(max).padStart(5, "0")}`;
    }
    return { ...r, id };
  });
}

function extractIdNumber(id: string | undefined | null): number {
  if (!id) return 0;
  const m = String(id).match(/PPA-(\d+)/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return Number.isNaN(n) ? 0 : n;
}
