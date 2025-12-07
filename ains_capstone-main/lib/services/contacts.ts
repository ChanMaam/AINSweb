// lib/services/contacts.ts
import { http } from "@/lib/http";

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type ContactInput = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
};

export async function listContacts(): Promise<Contact[]> {
  // backend returns simple list or { items: [...] }
  const data = await http.get("/contacts");

  const arr: any[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.items)
    ? (data as any).items
    : [];

  return arr.map((r) => ({
    id: String(r?.id ?? ""),
    name: String(r?.name ?? ""),
    email: String(r?.email ?? ""),
    phone: String(r?.phone ?? ""),
  }));
}

/** Append new + update existing by id (CSV import) */
export async function upsertContacts(
  rows: Contact[]
): Promise<{ updated: number; inserted: number }> {
  // backend route supports UPSERT; adjust if your route differs
  return http.post("/contacts/import?mode=append", { items: rows });
}

/** Replace all contacts with provided rows (CSV import) */
export async function replaceContacts(
  rows: Contact[]
): Promise<{ replaced: number }> {
  return http.post("/contacts/import?mode=replace", { items: rows });
}

/** NEW: create or update a single contact */
export async function createContact(input: ContactInput): Promise<Contact> {
  const data = await http.post("/contacts", input);

  return {
    id: String((data as any)?.id ?? ""),
    name: String((data as any)?.name ?? ""),
    email: String((data as any)?.email ?? ""),
    phone: String((data as any)?.phone ?? ""),
  };
}

/** NEW: delete a single contact by Client ID */
export async function deleteContact(
  id: string
): Promise<{ deleted: boolean }> {
  const data = await http.delete(`/contacts/${encodeURIComponent(id)}`);
  return {
    deleted: Boolean((data as any)?.deleted ?? false),
  };
}
