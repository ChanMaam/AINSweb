"use client"

import { useState } from "react"
import { Send, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Inter, Anton } from "next/font/google"

// Fonts
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const anton = Anton({ subsets: ["latin"], weight: ["400"] })

type Channel = "" | "sms" | "gmail" | "both"

export default function MessagingPage() {
  const [message, setMessage] = useState("")
  const [channel, setChannel] = useState<Channel>("") // "" means unselected
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")

  const characterCount = message.length
  const maxCharacters = 160

  const handleSendNow = () => {
    if (!channel) {
      alert("Please select a channel")
      return
    }
    alert(`Message sent via ${channel.toUpperCase()}`)
    setMessage("")
  }

  const handleSchedule = () => {
    if (!channel) {
      alert("Please select a channel")
      return
    }
    if (!scheduleDate || !scheduleTime) {
      alert("Please select date and time for scheduling")
      return
    }
    alert(`Message scheduled via ${channel.toUpperCase()} on ${scheduleDate} ${scheduleTime}`)
    setMessage("")
    setScheduleDate("")
    setScheduleTime("")
  }

  return (
    <div className={`flex flex-col gap-6 p-8 bg-white min-h-screen text-[#0C1D40] ${inter.className}`}>
      {/* Header */}
      <div>
        <h1 className={`text-4xl font-extrabold tracking-wide uppercase ${anton.className}`}>
          Messaging
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Compose and send SMS/Gmail messages to clients
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compose Section */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <h2 className={`text-xl font-bold mb-4 ${anton.className}`}>Compose Message</h2>

            <div className="space-y-4">
              {/* Channel Selection */}
              <div className="space-y-3">
                <Label className="text-[#0C1D40] font-medium">Select Channel</Label>
                <RadioGroup value={channel} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="sms"
                      id="sms"
                      checked={channel === "sms"}
                      onClick={() => setChannel(channel === "sms" ? "" : "sms")}
                    />
                    <Label htmlFor="sms" className="font-normal cursor-pointer">SMS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="gmail"
                      id="gmail"
                      checked={channel === "gmail"}
                      onClick={() => setChannel(channel === "gmail" ? "" : "gmail")}
                    />
                    <Label htmlFor="gmail" className="font-normal cursor-pointer">Gmail</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="both"
                      id="both"
                      checked={channel === "both"}
                      onClick={() => setChannel(channel === "both" ? "" : "both")}
                    />
                    <Label htmlFor="both" className="font-normal cursor-pointer">Both (SMS + Gmail)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Message Text */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-[#0C1D40] font-medium">Message Content</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[150px] resize-none rounded-lg border-gray-300 focus-visible:ring-2 focus-visible:ring-[#E8B86D] focus-visible:border-transparent"
                  maxLength={maxCharacters}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Messages will be sent via the selected channel</span>
                  <span>{characterCount}/{maxCharacters} characters</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSendNow}
                  disabled={!message}
                  className="gap-2 bg-[#E8B86D] hover:bg-[#d0a95f] text-[#0C1D40] font-semibold"
                >
                  <Send className="h-4 w-4" />
                  Send Now
                </Button>
                <Button
                  onClick={handleSchedule}
                  disabled={!message}
                  variant="outline"
                  className="gap-2 border-[#0C1D40] text-[#0C1D40] hover:bg-[#0C1D40] hover:text-white"
                >
                  <Clock className="h-4 w-4" />
                  Schedule Message
                </Button>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <h2 className={`text-xl font-bold mb-4 ${anton.className}`}>Schedule Settings</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schedule-date" className="text-[#0C1D40] font-medium">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#E8B86D]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time" className="text-[#0C1D40] font-medium">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#E8B86D]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Messages Sidebar */}
        <div className="rounded-2xl border border-[#0C1D40] bg-[#0C1D40] p-6 shadow-md">
          <h2 className={`text-xl font-bold mb-4 text-[#E8B86D] ${anton.className}`}>Recent Messages</h2>
          <div className="space-y-4">
            {[
              { time: "10 min ago", recipient: "All Clients", preview: "Reminder: Court hearing tomorrow at 9 AM" },
              { time: "1 hour ago", recipient: "PPA-12345", preview: "Please confirm your attendance for..." },
              { time: "2 hours ago", recipient: "Officer Santos' Group", preview: "Monthly check-in scheduled for next week" },
              { time: "Yesterday", recipient: "Active Clients", preview: "Important: Update your contact information" },
            ].map((msg, index) => (
              <div key={index} className="border-b border-white/10 pb-3 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">{msg.recipient}</span>
                  <span className="text-xs text-gray-300">{msg.time}</span>
                </div>
                <p className="text-sm text-gray-200 line-clamp-2">{msg.preview}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
