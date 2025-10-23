"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Inter, Anton } from "next/font/google"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const anton = Anton({ subsets: ["latin"], weight: ["400"] })

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true)
  

  return (
    <div className={`flex flex-col gap-8 p-8 bg-white min-h-screen text-[#0C1D40] ${inter.className}`}>
      {/* Header */}
      <div>
        <h1 className={`text-4xl font-extrabold tracking-wide uppercase ${anton.className}`}>
          Settings
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure system settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* GSM Module Status */}
        <Card className="rounded-2xl shadow-md bg-[#0C1D40] text-white border-none">
          <CardHeader>
            <CardTitle className={`text-[#E8B86D] ${anton.className}`}>GSM Module Connection</CardTitle>
            <CardDescription className="text-gray-300">Hardware connection status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/10 p-4 bg-white/5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-semibold">Connected</p>
                  <p className="text-sm text-gray-300">Signal strength: Strong</p>
                </div>
              </div>
              {/* Fixed: no white hover, still clickable */}
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 text-white bg-transparent hover:bg-transparent hover:text-white active:scale-95"
              >
                Test Connection
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Port:</span>
                <span className="font-semibold">COM3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Baud Rate:</span>
                <span className="font-semibold">115200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Network:</span>
                <span className="font-semibold">Smart Communications</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Alerts */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className={`${anton.className}`}>Notification Alerts</CardTitle>
            <CardDescription>Configure alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
              <div className="space-y-0.5">
                <Label className="text-[#0C1D40] font-medium">Email Alerts</Label>
                <p className="text-sm text-gray-600">Receive email notifications for failed messages</p>
              </div>
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-[#0C1D40] font-medium">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@ppa.gov.ph"
                defaultValue="admin@ppa.gov.ph"
                className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#E8B86D]"
              />
            </div>

            <Button className="w-full bg-[#E8B86D] hover:bg-[#d0a95f] text-[#0C1D40] font-semibold">
              Save Email Settings
            </Button>
          </CardContent>
        </Card>

        {/* Chatbot feature removed */}
      </div>
    </div>
  )
}
