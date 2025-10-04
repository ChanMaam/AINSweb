"use client"

import { useState } from "react"
import { Upload, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Inter, Anton } from "next/font/google"

// ✅ Load fonts
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const anton = Anton({ subsets: ["latin"], weight: ["400"] })

// Sample data
const sampleContacts = [
  { id: "PPA-12345", officer: "Officer Santos", status: "Active", lastContact: "2025-02-08" },
  { id: "PPA-67890", officer: "Officer Reyes", status: "Active", lastContact: "2025-02-07" },
  { id: "PPA-54321", officer: "Officer Cruz", status: "Inactive", lastContact: "2025-01-15" },
  { id: "PPA-98765", officer: "Officer Santos", status: "Active", lastContact: "2025-02-09" },
  { id: "PPA-11111", officer: "Officer Garcia", status: "Active", lastContact: "2025-02-08" },
  { id: "PPA-22222", officer: "Officer Reyes", status: "Active", lastContact: "2025-02-06" },
  { id: "PPA-33333", officer: "Officer Cruz", status: "Inactive", lastContact: "2025-01-20" },
  { id: "PPA-44444", officer: "Officer Santos", status: "Active", lastContact: "2025-02-09" },
]

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOfficer, setFilterOfficer] = useState("all")

  const filteredContacts = sampleContacts.filter((contact) => {
    const matchesSearch = contact.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesOfficer = filterOfficer === "all" || contact.officer === filterOfficer
    return matchesSearch && matchesOfficer
  })

  const handleUploadCSV = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        console.log("File selected:", file.name)
      }
    }
    input.click()
  }

  return (
    <div
      className={`flex flex-col gap-6 p-8 bg-white min-h-screen text-[#0C1D40] ${inter.className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-4xl font-extrabold tracking-wide text-[#0C1D40] uppercase ${anton.className}`}
          >
            Contacts
          </h1>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            Manage client contacts by ID
          </p>
        </div>
        <Button
          onClick={handleUploadCSV}
          className="gap-2 bg-[#E8B86D] hover:bg-[#d0a95f] text-[#0C1D40] font-semibold"
        >
          <Upload className="h-4 w-4" />
          Upload CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-md sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by Client ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#E8B86D]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={filterOfficer} onValueChange={setFilterOfficer}>
            <SelectTrigger className="w-[200px] h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#E8B86D]">
              <SelectValue placeholder="Filter by officer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Officers</SelectItem>
              <SelectItem value="Officer Santos">Officer Santos</SelectItem>
              <SelectItem value="Officer Reyes">Officer Reyes</SelectItem>
              <SelectItem value="Officer Cruz">Officer Cruz</SelectItem>
              <SelectItem value="Officer Garcia">Officer Garcia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#0C1D40] hover:bg-[#0C1D40]">
              <TableHead className="text-white text-sm font-semibold">Client ID</TableHead>
              <TableHead className="text-white text-sm font-semibold">Assigned Officer</TableHead>
              <TableHead className="text-white text-sm font-semibold">Status</TableHead>
              <TableHead className="text-white text-sm font-semibold">Last Contact</TableHead>
              <TableHead className="text-white text-sm font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-gray-500 font-medium"
                >
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-semibold text-[#0C1D40]">{contact.id}</TableCell>
                  <TableCell className="text-gray-700">{contact.officer}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        contact.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {contact.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700">{contact.lastContact}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#0C1D40] hover:text-[#E8B86D]"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <p>
          Showing {filteredContacts.length} of {sampleContacts.length} contacts
        </p>
      </div>
    </div>
  )
}
