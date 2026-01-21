import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatThaiDate(date: Date | string, format: "short" | "long" = "long"): string {
  const d = new Date(date)
  const thaiMonths = {
    short: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
    long: [
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
    ],
  }

  const day = d.getDate()
  const month = thaiMonths[format][d.getMonth()]
  const year = d.getFullYear() + 543

  return `${day} ${month} ${year}`
}

export function formatThaiDateShort(date: Date | string): string {
  return formatThaiDate(date, "short")
}

export function formatThaiDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const thaiMonthsShort = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ]

  const startDay = start.getDate()
  const startMonth = thaiMonthsShort[start.getMonth()]
  const startYear = start.getFullYear() + 543

  const endDay = end.getDate()
  const endMonth = thaiMonthsShort[end.getMonth()]
  const endYear = end.getFullYear() + 543

  if (startYear === endYear) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`
  }

  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`
}
