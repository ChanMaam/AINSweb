"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Inter, Anton } from "next/font/google"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const anton = Anton({ subsets: ["latin"], weight: ["400"] })

const failedMessages = [
  {
    id: 1,
    clientId: "PPA-12345",
    message: "Reminder: Court hearing tomorrow",
    reason: "Invalid number",
    time: "2025-02-09 10:30",
  },
  {
    id: 2,
    clientId: "PPA-67890",
    message: "Please confirm your attendance",
    reason: "Network error",
    time: "2025-02-09 09:15",
  },
  {
    id: 3,
    clientId: "PPA-54321",
    message: "Monthly check-in reminder",
    reason: "Number not in service",
    time: "2025-02-08 14:20",
  },
  {
    id: 4,
    clientId: "PPA-98765",
    message: "Update your contact information",
    reason: "Delivery timeout",
    time: "2025-02-08 11:45",
  },
]

export default function ReportsPage() {
  const handleExportReport = () => {
    console.log("Exporting report...")
    alert("Report exported successfully!")
  }

  return (
    <div className={`flex flex-col gap-8 p-8 bg-white min-h-screen text-[#0C1D40] ${inter.className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-extrabold tracking-wide uppercase ${anton.className}`}>
            Reports
          </h1>
          <p className="mt-2 text-sm text-gray-600">Analytics and message delivery logs</p>
        </div>
        <Button
          onClick={handleExportReport}
          className="gap-2 bg-[#E8B86D] hover:bg-[#d0a95f] text-[#0C1D40] font-semibold"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="rounded-2xl shadow-md bg-[#0C1D40] text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#E8B86D]">
              Total Sent (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">3,847</div>
            <p className="text-xs mt-1 text-green-400">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-[#0C1D40] text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#E8B86D]">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">98.2%</div>
            <p className="text-xs mt-1 text-green-400">+0.5% from last month</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-[#0C1D40] text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#E8B86D]">Auto-Reply Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">76.4%</div>
            <p className="text-xs mt-1 text-gray-300">Of received messages</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md bg-[#0C1D40] text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#E8B86D]">Failed Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">23</div>
            <p className="text-xs mt-1 text-red-400">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className={`${anton.className} text-lg`}>Messages Sent per Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-sm text-gray-500">Chart visualization</p>
                <p className="text-xs text-gray-500 mt-1">Weekly message statistics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className={`${anton.className} text-lg`}>Replies Received vs Auto-Replied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-sm text-gray-500">Chart visualization</p>
                <p className="text-xs text-gray-500 mt-1">Monthly reply statistics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failed Messages Log */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className={`${anton.className} text-lg`}>Failed Message Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0C1D40] hover:bg-[#0C1D40]">
                  <TableHead className="text-white text-sm font-semibold">Client ID</TableHead>
                  <TableHead className="text-white text-sm font-semibold">Message</TableHead>
                  <TableHead className="text-white text-sm font-semibold">Failure Reason</TableHead>
                  <TableHead className="text-white text-sm font-semibold">Timestamp</TableHead>
                  <TableHead className="text-white text-sm font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedMessages.map((msg) => (
                  <TableRow key={msg.id} className="hover:bg-gray-50">
                    <TableCell className="font-semibold text-[#0C1D40]">{msg.clientId}</TableCell>
                    <TableCell className="max-w-xs truncate text-gray-700">{msg.message}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                        {msg.reason}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">{msg.time}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#0C1D40] hover:text-[#E8B86D]"
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
  )
}
