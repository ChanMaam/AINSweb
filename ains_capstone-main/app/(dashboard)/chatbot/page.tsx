"use client"

import { useState } from "react"
import { Bot, User, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Inter, Anton } from "next/font/google"

// Fonts
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const anton = Anton({ subsets: ["latin"], weight: ["400"] })

// Sample conversation data
const sampleConversations = [
  { id: "PPA-12345", lastMessage: "Yes, I will attend", time: "2 min ago", unread: 2 },
  { id: "PPA-67890", lastMessage: "Thank you for the reminder", time: "15 min ago", unread: 0 },
  { id: "PPA-54321", lastMessage: "Can I reschedule?", time: "1 hour ago", unread: 1 },
  { id: "PPA-98765", lastMessage: "Confirmed", time: "2 hours ago", unread: 0 },
]

const sampleMessages = [
  {
    id: 1,
    sender: "admin",
    text: "Reminder: You have a court hearing scheduled for tomorrow at 9:00 AM. Please reply YES to confirm your attendance.",
    timestamp: "10:30 AM",
    isAuto: false,
  },
  {
    id: 2,
    sender: "client",
    text: "Yes",
    timestamp: "10:35 AM",
    isAuto: false,
  },
  {
    id: 3,
    sender: "bot",
    text: "Thank you for confirming. Your attendance has been recorded. See you tomorrow at 9:00 AM.",
    timestamp: "10:35 AM",
    isAuto: true,
  },
  {
    id: 4,
    sender: "client",
    text: "What should I bring?",
    timestamp: "10:40 AM",
    isAuto: false,
  },
]

export default function ChatbotPage() {
  const [selectedConversation, setSelectedConversation] = useState("PPA-12345")
  const [manualReply, setManualReply] = useState("")

  const handleSendManualReply = () => {
    if (!manualReply.trim()) return
    console.log("Sending manual reply:", manualReply)
    // Handle manual reply logic here
    setManualReply("")
  }

  return (
    <div className={`flex h-[calc(100vh-4rem)] flex-col gap-6 p-8 bg-white text-[#0C1D40] ${inter.className}`}>
      {/* Header */}
      <div>
        <h1 className={`text-4xl font-extrabold tracking-wide uppercase ${anton.className}`}>
          Chatbot Conversations
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage automated chatbot interactions
        </p>
      </div>

      {/* Chat Interface */}
      <div className="flex flex-1 gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200">
          <div className="border-b border-gray-200 p-4">
            <h2 className={`font-bold text-lg ${anton.className}`}>Conversations</h2>
          </div>
          <ScrollArea className="h-[calc(100%-4rem)]">
            <div className="p-2">
              {sampleConversations.map((conv) => {
                const isActive = selectedConversation === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={[
                      "w-full rounded-xl p-3 text-left transition-colors",
                      isActive
                        ? "bg-[#0C1D40] text-white"
                        : "hover:bg-gray-50 text-[#0C1D40]",
                    ].join(" ")}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-semibold">{conv.id}</span>
                      {conv.unread > 0 && (
                        <span
                          className={[
                            "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                            isActive ? "bg-[#E8B86D] text-[#0C1D40]" : "bg-[#E8B86D] text-[#0C1D40]",
                          ].join(" ")}
                        >
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p
                      className={[
                        "line-clamp-1 text-xs",
                        isActive ? "text-white/80" : "text-gray-600",
                      ].join(" ")}
                    >
                      {conv.lastMessage}
                    </p>
                    <span className={isActive ? "text-white/70 text-xs" : "text-gray-500 text-xs"}>
                      {conv.time}
                    </span>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Chat Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold ${anton.className}`}>{selectedConversation}</h3>
                <p className="text-xs text-gray-600">Chatbot enabled</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-gray-600">Active</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {sampleMessages.map((msg) => {
                const isClient = msg.sender === "client"
                const isBot = msg.sender === "bot"
                const isAdmin = msg.sender === "admin"
                return (
                  <div key={msg.id} className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
                    <div className={`flex max-w-[70%] gap-2 ${isClient ? "flex-row" : "flex-row-reverse"}`}>
                      {/* Avatar */}
                      <div
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          isClient
                            ? "bg-gray-100"
                            : isBot
                              ? "bg-[#E8B86D]/20"
                              : "bg-[#0C1D40]",
                        ].join(" ")}
                      >
                        {isClient ? (
                          <User className="h-4 w-4 text-[#0C1D40]" />
                        ) : isBot ? (
                          <Bot className="h-4 w-4 text-[#0C1D40]" />
                        ) : (
                          <span className="text-xs font-bold text-white">A</span>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={`flex flex-col ${isClient ? "items-start" : "items-end"}`}>
                        <div
                          className={[
                            "rounded-2xl px-4 py-2",
                            isClient
                              ? "bg-gray-100 text-[#0C1D40]"
                              : isBot
                                ? "bg-[#E8B86D]/20 text-[#0C1D40] border border-[#E8B86D]/30"
                                : "bg-[#0C1D40] text-white",
                          ].join(" ")}
                        >
                          {msg.isAuto && (
                            <span className="mb-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide opacity-70">
                              <Bot className="h-3 w-3" />
                              Auto-reply
                            </span>
                          )}
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="mt-1 text-xs text-gray-500">{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {/* Manual Reply Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a manual reply to override chatbot..."
                value={manualReply}
                onChange={(e) => setManualReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendManualReply()
                  }
                }}
                className="h-11 rounded-xl border-gray-300 focus-visible:ring-2 focus-visible:ring-[#E8B86D] focus-visible:border-transparent"
              />
              <Button
                onClick={handleSendManualReply}
                size="icon"
                className="h-11 w-11 bg-[#E8B86D] hover:bg-[#d0a95f] text-[#0C1D40] font-semibold rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Manual replies will override the chatbot for this conversation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
