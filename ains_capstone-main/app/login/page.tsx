"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Inter, Anton } from "next/font/google"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const anton = Anton({ subsets: ["latin"], weight: ["400"] })

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center bg-[#0C1D40] px-4 text-white ${inter.className}`}
    >
      {/* Logo + Text Block */}
      <div className="flex items-center mb-8">
        {/* Logo */}
        <Image
          src="/AINSlogo.png"
          alt="AINS Logo"
          width={160}
          height={160}
          className="mr-8"
        />

        {/* Text beside the logo */}
        <div className="flex flex-col justify-center items-start">
          <h1 className={`${anton.className} text-8xl font-extrabold tracking-wide leading-none`}>
            AINS
          </h1>
          <h2 className={`${anton.className} text-4xl font-semibold mt-4`}>
            WELCOME
          </h2>
          <p className="text-lg text-gray-300 mt-1 font-medium">
            login to access your dashboard
          </p>
        </div>
      </div>

      {/* Login Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/20"
      >
        <div className="mb-6">
          <Label htmlFor="email" className="text-white text-base font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 h-12 rounded-lg border border-white/30 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#E8B86D] focus:border-none"
          />
        </div>

        <div className="mb-6">
          <Label htmlFor="password" className="text-white text-base font-medium">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-2 h-12 rounded-lg border border-white/30 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#E8B86D] focus:border-none"
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            className="text-[#E8B86D] hover:text-[#d0a95f] text-sm font-medium"
          >
            Forgot Password?
          </button>

          <Button
            type="submit"
            className="bg-[#E8B86D] hover:bg-[#d0a95f] text-white px-8 py-2 rounded-lg text-base font-semibold shadow-md"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </form>

      {/* Footer */}
      <footer className="mt-10 text-center text-sm text-gray-300">
        <p>© 2025 AINS - All Rights Reserved</p>
        <p>Parole and Probation Administration of Misamis Oriental</p>
      </footer>
    </div>
  )
}
