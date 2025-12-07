"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Inter, Anton } from "next/font/google";
import { http } from "@/lib/http";
import { Eye, EyeOff } from "lucide-react";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const anton = Anton({ subsets: ["latin"], weight: ["400"] });

type LoginRes = {
  ok: boolean;
  role?: "admin" | "user";
  email?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // ---- LOGIN ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = (await http.post("/auth/login", {
        email: cleanEmail,
        password,
      })) as LoginRes;

      const role = res?.role || "user";

      // keep this for UI logic if you still want it
      localStorage.setItem("ains_role", role);
      localStorage.setItem("ains_email", (res?.email || cleanEmail).toLowerCase());

      if (role === "admin") router.push("/admin");
      else router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---- FORGOT PASSWORD ----
  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("Please type the AINS email first, then click Forgot Password.");
      return;
    }

    setError(null);
    setInfo(null);
    setSendingReset(true);

    try {
      await http.post("/auth/forgot-password", { email: cleanEmail });
      setInfo("If this email is registered for AINS, login details were sent to it.");
    } catch (err: any) {
      setError(err?.message || "Failed to send password email. Please try again.");
    } finally {
      setSendingReset(false);
    }
  };

  const handleGoSignup = () => router.push("/signup");
  const linksDisabled = isLoading || sendingReset;

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center bg-[#0C1D40] px-4 text-white ${inter.className}`}
    >
      {/* Logo + Text Block */}
      <div className="flex items-center mb-8">
        <Image
          src="/AINSlogo.png"
          alt="AINS Logo"
          width={160}
          height={160}
          className="mr-8"
        />

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
            disabled={isLoading || sendingReset}
            className="mt-2 h-12 rounded-lg border border-white/30 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#E8B86D] focus:border-none"
          />
        </div>

        <div className="mb-6">
          <Label htmlFor="password" className="text-white text-base font-medium">
            Password
          </Label>

          <div className="relative mt-2">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || sendingReset}
              className="h-12 pr-12 rounded-lg border border-white/30 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#E8B86D] focus:border-none"
            />

            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              aria-label={showPw ? "Hide password" : "Show password"}
              disabled={isLoading || sendingReset}
            >
              {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Error / Info messages */}
        {(error || info) && (
          <div className="mb-4 text-sm">
            {error && <p className="text-red-300">{error}</p>}
            {info && <p className="text-green-300">{info}</p>}
          </div>
        )}

        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[#E8B86D] hover:text-[#d0a95f] text-sm font-medium disabled:opacity-60"
              disabled={linksDisabled}
            >
              {sendingReset ? "Sending..." : "Forgot Password?"}
            </button>

            <button
              type="button"
              onClick={handleGoSignup}
              className="text-[#E8B86D] hover:text-[#d0a95f] text-sm font-medium disabled:opacity-60"
              disabled={linksDisabled}
            >
              Create an account
            </button>
          </div>

          <Button
            type="submit"
            className="bg-[#E8B86D] hover:bg-[#d0a95f] text-white px-8 py-2 rounded-lg text-base font-semibold shadow-md"
            disabled={isLoading || sendingReset}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </form>

      <footer className="mt-10 text-center text-sm text-gray-300">
        <p>© 2025 AINS - All Rights Reserved</p>
        <p>Parole and Probation Administration of Misamis Oriental</p>
      </footer>
    </div>
  );
}
