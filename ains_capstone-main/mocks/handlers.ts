import { http, HttpResponse, delay } from "msw";
import { faker } from "@faker-js/faker";

// Fake data for your UI
const devices = Array.from({ length: 5 }).map((_, i) => ({
  id: `dev-${i + 1}`,
  name: `GSM Modem ${i + 1}`,
  signal: faker.number.int({ min: 10, max: 28 }),
}));

const contacts = [
  { id: "PPA-12345", assignedOfficer: "Officer Santos", status: "Active",   lastContact: "2025-02-08" },
  { id: "PPA-67890", assignedOfficer: "Officer Reyes",  status: "Active",   lastContact: "2025-02-07" },
  { id: "PPA-54321", assignedOfficer: "Officer Cruz",   status: "Inactive", lastContact: "2025-01-15" },
  { id: "PPA-98765", assignedOfficer: "Officer Santos", status: "Active",   lastContact: "2025-02-09" },
  { id: "PPA-11111", assignedOfficer: "Officer Garcia", status: "Active",   lastContact: "2025-02-08" },
  { id: "PPA-22222", assignedOfficer: "Officer Reyes",  status: "Active",   lastContact: "2025-02-06" },
  { id: "PPA-33333", assignedOfficer: "Officer Cruz",   status: "Inactive", lastContact: "2025-01-20" },
  { id: "PPA-44444", assignedOfficer: "Officer Santos", status: "Active",   lastContact: "2025-02-09" },
];


const failedLogs = [
  { clientId: "PPA-12345", message: "Reminder: Court hearing tomorrow", reason: "Invalid number",         timestamp: "2025-02-09T10:30:00Z" },
  { clientId: "PPA-67890", message: "Please confirm your attendance",   reason: "Network error",          timestamp: "2025-02-09T09:15:00Z" },
  { clientId: "PPA-54321", message: "Monthly check-in reminder",        reason: "Number not in service",  timestamp: "2025-02-08T14:20:00Z" },
  { clientId: "PPA-98765", message: "Update your contact information",  reason: "Delivery timeout",       timestamp: "2025-02-08T11:45:00Z" },
];

const summary = {
  totalSent: 3847,
  deliveryRate: 98.2,
  autoReplyRate: 76.4,
  failedCount: 23,
};

export const handlers = [
  // Dashboard / Settings
  http.get("/devices", async () => {
    await delay(300);
    return HttpResponse.json(devices, { status: 200 });
  }),

  // Contacts
  http.get("/contacts", async () => {
    await delay(300);
    return HttpResponse.json(contacts, { status: 200 });
  }),

  // Messaging
  http.post("/messaging/send", async ({ request }) => {
    await delay(faker.number.int({ min: 200, max: 1200 }));
    const body = await request.json();
    if (!body?.content) {
      return HttpResponse.json({ error: { message: "Message content is required" } }, { status: 400 });
    }
    return new HttpResponse(null, { status: 202 });
  }),

  // Chatbot removed

  // Reports
  http.get("/reports/summary", async () => {
    await delay(250);
    return HttpResponse.json(summary, { status: 200 });
  }),
  http.get("/reports/failed", async () => {
    await delay(350);
    return HttpResponse.json(failedLogs, { status: 200 });
  }),

  // Settings
  http.get("/settings/status", async () => {
    await delay(200);
    return HttpResponse.json(
      { connected: true, signal: "Strong", port: "COM3", baud: 115200, network: "Smart Communications" },
      { status: 200 }
    );
  }),
  http.post("/settings/test-connection", async () => {
    await delay(400);
    return new HttpResponse(null, { status: 200 });
  }),
];
