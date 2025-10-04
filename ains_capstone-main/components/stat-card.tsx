import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode        // ✅ accept rendered node (RSC-safe)
  description?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
  tone?: "light" | "dark"
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
  tone = "light",
}: StatCardProps) {
  const isDark = tone === "dark"

  const titleCls = isDark ? "text-[#E8B86D]" : "text-muted-foreground"
  const valueCls = "text-white"
  const descCls  = isDark ? "text-gray-300" : "text-muted-foreground"

  // ✅ Trend colors: green for positive, red for negative
  const trendPos = "text-green-400"
  const trendNeg = "text-red-400"

  return (
    <Card className={cn("transition-shadow hover:shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-semibold", titleCls)}>{title}</CardTitle>
        {icon ? <div className="shrink-0">{icon}</div> : null}
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-extrabold", valueCls)}>{value}</div>
        {description && <p className={cn("text-xs mt-1", descCls)}>{description}</p>}
        {trend && (
          <p className={cn("text-xs mt-1 font-medium", trend.isPositive ? trendPos : trendNeg)}>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
