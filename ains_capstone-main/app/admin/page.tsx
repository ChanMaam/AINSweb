"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { http } from "@/lib/http";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

type UserRow = {
  id: number;
  email: string;
  full_name?: string | null;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const me = (await http.get("/auth/me")) as any;
      if (me?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
      const data = (await http.get("/auth/users")) as UserRow[];
      setUsers(data || []);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this user account?")) return;
    await http.delete(`/auth/users/${id}`);
    await load();
  }

  async function handleLogout() {
    try {
      await http.post("/auth/logout", {});
    } catch {
      // ignore — still redirect
    } finally {
      router.replace("/login");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white p-8 text-[#0C1D40]">
      {/* Header Bar */}
      <div className="mb-6 rounded-2xl bg-[#0C1D40] p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide uppercase text-[#E8B86D]">
              Admin
            </h1>
            <p className="mt-1 text-sm text-gray-200">
              View and remove user accounts created via Sign Up.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-[#0C1D40] border border-white/25 hover:bg-[#102a5b] text-white font-semibold rounded-lg"
            >
              Go to Dashboard
            </Button>

            <Button
              onClick={handleLogout}
              className="bg-[#E8B86D] hover:bg-[#d0a95f] text-[#0C1D40] font-semibold rounded-lg"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <Card className="rounded-2xl shadow-md border border-gray-200">
        <CardHeader>
          <CardTitle className="text-[#0C1D40]">Registered Users</CardTitle>
          <CardDescription>
            Only the admin account can access this page.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="rounded-xl border border-gray-200 p-6 text-gray-600">
              Loading...
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-gray-200 p-6 text-gray-600">
              No users found.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-[#0C1D40]">
                    <th className="p-3 font-semibold">ID</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Full Name</th>
                    <th className="p-3 font-semibold">Created</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="p-3 font-medium">{u.id}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.full_name || "-"}</td>
                      <td className="p-3 text-gray-600">{u.created_at}</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(u.id)}
                          className="rounded-lg"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Small note */}
          <div className="mt-4 text-xs text-gray-500">
            Tip: Delete unauthorized accounts immediately to keep access limited
            to PPA-approved staff.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
