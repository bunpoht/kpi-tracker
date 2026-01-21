"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

interface MonthYearInputProps {
  value: string // Format: "YYYY-MM-DD"
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  id?: string
  className?: string
  type?: "start" | "end" // "start" = วันที่ 1, "end" = วันสุดท้าย
}

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
]

export function MonthYearInput({
  value,
  onChange,
  placeholder = "เลือกเดือน/ปี",
  required,
  id,
  className,
  type = "start",
  modal = true,
}: MonthYearInputProps & { modal?: boolean }) {
  const [open, setOpen] = React.useState(false)

  // Parse current value
  const currentDate = value ? new Date(value) : new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth)
  const [selectedYear, setSelectedYear] = React.useState(currentYear)

  React.useEffect(() => {
    if (open) {
      const d = value ? new Date(value) : new Date()
      setSelectedMonth(d.getMonth())
      setSelectedYear(d.getFullYear())
    }
  }, [open, value])

  const handleSelect = (month: number, year: number) => {
    // สร้างวันที่ตามประเภท: start = วันที่ 1, end = วันสุดท้าย
    const day = type === "start" ? 1 : new Date(year, month + 1, 0).getDate()
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    onChange(dateStr)
    setOpen(false)
  }

  const displayText = value ? `${THAI_MONTHS[currentMonth]} ${currentYear + 543}` : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal font-prompt",
            !value && "text-muted-foreground",
            className,
          )}
          type="button"

        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          {/* Year selector */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" type="button" onClick={() => setSelectedYear(selectedYear - 1)} className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-prompt font-semibold text-sm">{selectedYear + 543}</div>
            <Button variant="outline" size="icon" type="button" onClick={() => setSelectedYear(selectedYear + 1)} className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {THAI_MONTHS.map((month, index) => (
              <Button
                key={index}
                variant={selectedMonth === index && selectedYear === currentYear ? "default" : "outline"}
                size="sm"
                className="font-prompt text-xs"
                type="button"
                onClick={() => {
                  setSelectedMonth(index)
                  handleSelect(index, selectedYear)
                }}
              >
                {month}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
