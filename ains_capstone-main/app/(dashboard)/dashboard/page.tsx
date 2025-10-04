import { Calendar, Send, MessageCircle, AlertCircle } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { Inter, Anton } from "next/font/google"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const anton = Anton({ subsets: ["latin"], weight: ["400"] })

export default function DashboardPage() {
  return (
    <div className={`flex min-h-screen flex-col gap-10 bg-white p-10 text-[#0C1D40] ${inter.className}`}>
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className={`text-4xl font-extrabold tracking-wide text-[#0C1D40] uppercase ${anton.className}`}>
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 font-medium">
          Overview of SMS Messaging System
        </p>
      </div>

      {/* Stats Grid (4 cards incl. Calendar) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Scheduled Messages"
          value="1,247"
          icon={<Calendar className="h-5 w-5 text-[#E8B86D]" />}
          description="Messages pending delivery"
          trend={{ value: "+12% from last month", isPositive: true }}
          className="bg-[#0C1D40] rounded-2xl p-6 shadow-md border-none"
          tone="dark"
        />
        <StatCard
          title="Total Sent Messages"
          value="8,542"
          icon={<Send className="h-5 w-5 text-[#E8B86D]" />}
          description="Successfully delivered"
          trend={{ value: "+8% from last month", isPositive: true }}
          className="bg-[#0C1D40] rounded-2xl p-6 shadow-md border-none"
          tone="dark"
        />
        <StatCard
          title="Messages Received Today"
          value="156"
          icon={<MessageCircle className="h-5 w-5 text-[#E8B86D]" />}
          description="Client responses"
          trend={{ value: "+23% from yesterday", isPositive: true }}
          className="bg-[#0C1D40] rounded-2xl p-6 shadow-md border-none"
          tone="dark"
        />
        <StatCard
          title="Failed/Undelivered"
          value="23"
          icon={<AlertCircle className="h-5 w-5 text-[#E8B86D]" />}
          description="Requires attention"
          trend={{ value: "-5% from last week", isPositive: false }}
          className="bg-[#0C1D40] rounded-2xl p-6 shadow-md border-none"
          tone="dark"
        />
      </div>

      {/* Recent Activity + System Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl bg-[#0C1D40] border border-[#0C1D40] p-6 shadow-md">
          <h3 className={`text-xl font-bold text-[#E8B86D] mb-4 ${anton.className}`}>
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[
              { time: "2 minutes ago", action: "Message sent to Client #12345", status: "success" },
              { time: "15 minutes ago", action: "Chatbot replied to Client #67890", status: "success" },
              { time: "1 hour ago", action: "Failed delivery to Client #54321", status: "error" },
              { time: "2 hours ago", action: "Scheduled 50 messages for tomorrow", status: "info" },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <div
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${
                    activity.status === "success"
                      ? "bg-green-400"
                      : activity.status === "error"
                      ? "bg-red-400"
                      : "bg-blue-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-white">{activity.action}</p>
                  <p className="text-xs text-gray-300">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-2xl bg-[#0C1D40] border border-[#0C1D40] p-6 shadow-md">
          <h3 className={`text-xl font-bold text-[#E8B86D] mb-4 ${anton.className}`}>
            System Status
          </h3>
          <div className="space-y-5">
            {[
              { label: "GSM Module", status: "Connected", color: "bg-green-400" },
              { label: "Chatbot Service", status: "Active", color: "bg-green-400" },
              { label: "Database", status: "Operational", color: "bg-green-400" },
              { label: "Message Queue", status: "Processing", color: "bg-[#E8B86D]" }, // yellow accent
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{item.label}</span>
                <span className="flex items-center gap-2 font-medium text-white">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 mt-10">
        © 2025 AINS - All Rights Reserved | Parole and Probation Administration of Misamis Oriental
      </footer>
    </div>
  )
}
