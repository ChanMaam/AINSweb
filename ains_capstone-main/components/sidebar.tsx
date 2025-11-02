"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, MessageSquare, BarChart3,  Repeat, Settings, LogOut } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Messaging", href: "/messaging", icon: MessageSquare },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
 // { name: "Auto Replies", href: "/settings?tab=auto-replies", icon: Repeat },




]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    // Clear session/auth if needed
    router.push("/login")
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-[#0C1D40] text-white shadow-lg">
      {/* Logo/Header */}
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <Image src="/AINSlogo.png" alt="AINS Logo" width={40} height={40} />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-wide">PPA SMS</span>
            <span className="text-xs text-gray-400">Admin Portal</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-[#E8B86D] text-[#0C1D40] font-semibold"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-[#0C1D40]" : "text-gray-400")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5 text-gray-400" />
          Logout
        </button>
      </div>
    </div>
  )
}
