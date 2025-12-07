"use client";

import React, { useMemo, useState } from "react";
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

const ADMIN_CODE = "012317";

export default function SignupPage() {
  const router = useRouter();

  // step 1 gate
  const [adminCode, setAdminCode] = useState("");
  const [codeOk, setCodeOk] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);

  // step 2 signup
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canUnlock = useMemo(() => adminCode.trim().length > 0, [adminCode]);
  const canSignup = useMemo(() => {
    return codeOk && email.trim().length > 0 && password.trim().length >= 8 && !isLoading;
  }, [codeOk, email, password, isLoading]);

  function handleCheckCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (adminCode.trim() !== ADMIN_CODE) {
      setCodeOk(false);
      setError("Invalid Admin Code.");
      return;
    }

    setCodeOk(true);
    setInfo("Admin Code verified. You may now create an account.");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!codeOk) return;
    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await http.post("/auth/signup", {
        adminCode: adminCode.trim(),
        fullName: fullName.trim() || undefined,
        email: email.trim(),
        password: password.trim(),
      });

      setInfo("Account created! You can now sign in.");
      setTimeout(() => router.push("/login"), 700);
    } catch (err: any) {
      setError(err?.message || "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center bg-[#0C1D40] px-4 text-white ${inter.className}`}>
      <div className="flex items-center mb-8">
        <Image src="/AINSlogo.png" alt="AINS Logo" width={160} height={160} className="mr-8" />
        <div className="flex flex-col justify-center items-start">
          <h1 className={`${anton.className} text-7xl font-extrabold tracking-wide leading-none`}>AINS</h1>
          <h2 className={`${anton.className} text-3xl font-semibold mt-3`}>SIGN UP</h2>
          <p className="text-base text-gray-300 mt-1 font-medium">admin-only account creation</p>
        </div>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/20">
        {!codeOk ? (
          <form onSubmit={handleCheckCode}>
            <div className="mb-6">
              <Label htmlFor="adminCode" className="text-white text-base font-medium">
                Admin Code
              </Label>

              <div className="relative mt-2">
                <Input
                  id="adminCode"
                  type={showAdminCode ? "text" : "password"}
                  placeholder="Enter admin code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="h-12 pr-12 rounded-lg border border-white/30 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#E8B86D] focus:border-none"
                />

                <button
                  type="button"
                  onClick={() => setShowAdminCode((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  aria-label={showAdminCode ? "Hide admin code" : "Show admin code"}
                >
                  {showAdminCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <p className="text-xs text-gray-300 mt-2">
                This code is required to prevent unauthorized account creation.
              </p>
            </div>

            {error && <p className="text-sm text-red-300 mb-3">{error}</p>}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-white/90 hover:text-white text-sm font-semibold underline underline-offset-4"
              >
                Back to login
              </button>

              <Button
                type="submit"
                className="bg-[#E8B86D] hover:bg-[#d0a95f] text-white px-6 py-2 rounded-lg text-base font-semibold shadow-md"
                disabled={!canUnlock}
              >
                Verify
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="mb-4">
              <Label htmlFor="fullName" className="text-white text-base font-medium">
                Full Name (optional)
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="e.g. Admin User"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 h-12 rounded-lg border border-white/30 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#E8B86D] focus:border-none"
              />
            </div>

            <div className="mb-4">
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

            <div className="mb-4">
              <Label htmlFor="password" className="text-white text-base font-medium">
                Password (min 8 chars)
              </Label>

              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-12 rounded-lg border border-white/30 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#E8B86D] focus:border-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {(error || info) && (
              <div className="mb-4 text-sm">
                {error && <p className="text-red-300">{error}</p>}
                {info && <p className="text-green-300">{info}</p>}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-white/90 hover:text-white text-sm font-semibold underline underline-offset-4"
                disabled={isLoading}
              >
                Back to login
              </button>

              <Button
                type="submit"
                className="bg-[#E8B86D] hover:bg-[#d0a95f] text-white px-6 py-2 rounded-lg text-base font-semibold shadow-md"
                disabled={!canSignup}
              >
                {isLoading ? "Creating..." : "Create account"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <footer className="mt-10 text-center text-sm text-gray-300">
        <p>© 2025 AINS - All Rights Reserved</p>
        <p>Parole and Probation Administration of Misamis Oriental</p>
      </footer>
    </div>
  );
}
