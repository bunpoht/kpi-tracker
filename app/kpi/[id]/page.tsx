"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts"
import type { Goal, GoalAssignment, WorkLog } from "@/types"
import { X, Home, ChevronLeft, ChevronRight, Filter, LogIn, LogOut, LayoutDashboard, Pencil, Trash2, Calendar, User, Clock, MoreVertical, Grid, RectangleVertical, Layers, ImagePlus, Upload } from 'lucide-react'
import { EditWorkLogForm } from "@/components/edit-worklog-dialog"
import { WorkLogFormDialog } from "@/components/worklog-form-dialog"
import { ImageUpload } from "@/components/image-upload"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface GoalDetails {
  goal: Goal
  assignments: (GoalAssignment & { user: { id: number; name: string; email: string; profilePicture?: string } })[]
  workLogs: (WorkLog & { user: { id: number; name: string; email: string; profilePicture?: string }; images?: { id: number; url: string }[] })[]
}

interface MonthlyData {
  month: string
  total?: number
  [key: string]: any // For dynamic sub-metric values
}

const THAI_MONTHS = [
  { value: "10", label: "ตุลาคม", shortLabel: "ต.ค." },
  { value: "11", label: "พฤศจิกายน", shortLabel: "พ.ย." },
  { value: "12", label: "ธันวาคม", shortLabel: "ธ.ค." },
  { value: "1", label: "มกราคม", shortLabel: "ม.ค." },
  { value: "2", label: "กุมภาพันธ์", shortLabel: "ก.พ." },
  { value: "3", label: "มีนาคม", shortLabel: "มี.ค." },
  { value: "4", label: "เมษายน", shortLabel: "เม.ย." },
  { value: "5", label: "พฤษภาคม", shortLabel: "พ.ค." },
  { value: "6", label: "มิถุนายน", shortLabel: "มิ.ย." },
  { value: "7", label: "กรกฎาคม", shortLabel: "ก.ค." },
  { value: "8", label: "สิงหาคม", shortLabel: "ส.ค." },
  { value: "9", label: "กันยายน", shortLabel: "ก.ย." },
]

const AVATAR_COLORS = [
  "bg-pink-200 text-pink-800",
  "bg-blue-200 text-blue-800",
  "bg-green-200 text-green-800",
  "bg-purple-200 text-purple-800",
  "bg-orange-200 text-orange-800",
  "bg-teal-200 text-teal-800",
  "bg-indigo-200 text-indigo-800",
  "bg-rose-200 text-rose-800",
  "bg-cyan-200 text-cyan-800",
  "bg-amber-200 text-amber-800",
]

export default function KPIDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Use React.use to unwrap params, casting React to any to avoid type errors if types are outdated
  const { id: goalId } = (React as any).use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<{ goal: Goal; assignments: any[]; workLogs: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [subMetrics, setSubMetrics] = useState<Array<{ id: number; name: string; color: string }>>([])
  const [allGoals, setAllGoals] = useState<{ id: number; title: string; displayOrder: number }[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [userData, setUserData] = useState<{ id: number; name: string; email: string; role: string } | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("all")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMenuVisible, setIsMenuVisible] = useState(false)
  const [editingWorkLog, setEditingWorkLog] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [imagesArePortrait, setImagesArePortrait] = useState(false)
  const [showWorkLogForm, setShowWorkLogForm] = useState(false)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("")
  const [displaySettings, setDisplaySettings] = useState({
    showWorkLogTitle: true,
    showWorkLogImages: true,
    showWorkLogDescription: true,
  })

  // State for Gallery Layout: 'masonry' | 'grid'
  const [galleryLayout, setGalleryLayout] = useState<'masonry' | 'grid'>('grid')
  // State for Left Column Layout: 'split' | 'unified'
  const [leftColumnLayout, setLeftColumnLayout] = useState<'split' | 'unified'>('unified')

  // Monthly images state
  const [monthlyImages, setMonthlyImages] = useState<any[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadingMonthly, setUploadingMonthly] = useState(false)
  const [pendingUploadFiles, setPendingUploadFiles] = useState<string[]>([])

  const startMonth = searchParams.get("startMonth")
  const startYear = searchParams.get("startYear")
  const endMonth = searchParams.get("endMonth")
  const endYear = searchParams.get("endYear")
  const currentMonth = searchParams.get("month")
  const fiscalYear = searchParams.get("fiscalYear")

  const startDate = startMonth && startYear ? `${startYear}-${startMonth.padStart(2, "0")}-01` : null
  const endDate =
    endMonth && endYear
      ? `${endYear}-${endMonth.padStart(2, "0")}-${new Date(Number(endYear), Number(endMonth), 0).getDate()}`
      : null

  // startYear is already in Gregorian calendar (e.g., 2025)
  const imageFilterDate = currentMonth && startYear && startMonth
    ? {
      year: Number.parseInt(currentMonth) < Number.parseInt(startMonth) ? Number.parseInt(startYear) + 1 : Number.parseInt(startYear),
      month: Number.parseInt(currentMonth)
    }
    : null

  console.log("[KPI Page] Render. Loading:", loading, "Data:", !!data, "GoalID:", goalId)

  useEffect(() => {
    checkAuth()
    fetchGoalDetails()
    fetchMonthlyData()
    fetchAllGoals()
    fetchDisplaySettings()
    fetchBackgroundSetting()
    fetchMonthlyImages()
  }, [goalId, startDate, endDate])

  useEffect(() => {
    fetchMonthlyImages()
  }, [selectedMonthValue, selectedFiscalYear])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Left arrow key - go to previous KPI
      if (event.key === "ArrowLeft" && hasPrevious) {
        goToPrevious()
      }
      // Right arrow key - go to next KPI
      else if (event.key === "ArrowRight" && hasNext) {
        goToNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, allGoals, searchParams])

  useEffect(() => {
    if (!data?.workLogs) return

    const allImages = data.workLogs.flatMap((log) => log.images || [])
    if (allImages.length === 0) return

    const firstImage = allImages[0]
    if (firstImage?.url) {
      const img = new Image()
      img.onload = () => {
        setImagesArePortrait(img.height > img.width)
      }
      img.src = firstImage.url
    }
  }, [data])

  // Force cleanup of pointer-events when dialogs close
  useEffect(() => {
    if (!editingWorkLog && !showWorkLogForm && !selectedImage) {
      const cleanup = () => {
        document.body.style.pointerEvents = ""
        document.body.style.removeProperty("pointer-events")
        document.body.removeAttribute("data-scroll-locked")
      }
      // Immediate cleanup
      cleanup()
      // Backup cleanup after a short delay to catch any race conditions
      const timer = setTimeout(cleanup, 100)
      return () => clearTimeout(timer)
    }
  }, [editingWorkLog, showWorkLogForm, selectedImage])

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" })
      if (response.ok) {
        const userData = await response.json()
        setUserData(userData.user)
      }
    } catch (error) {
      console.log("[v0] User not authenticated")
    }
  }

  async function fetchGoalDetails() {
    try {
      let url = `/api/goals/${goalId}`
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const goalData = await response.json()
        setData(goalData)
      } else {
        console.error("Failed to fetch goal:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch goal details:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMonthlyData() {
    try {
      let url = `/api/goals/${goalId}/monthly`
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        setMonthlyData(result.data)
        setSubMetrics(result.subMetrics || [])
      }
    } catch (error) {
      console.error("Failed to fetch monthly data:", error)
    }
  }

  async function fetchAllGoals() {
    try {
      // Use the lightweight list endpoint for navigation
      const response = await fetch("/api/goals/list")
      if (response.ok) {
        const result = await response.json()
        // The API already sorts by displayOrder, but we can ensure it here if needed
        const sortedGoals = result.goals
        setAllGoals(sortedGoals)
        const index = sortedGoals.findIndex((g: any) => g.id === Number.parseInt(goalId))
        setCurrentIndex(index)
      }
    } catch (error) {
      console.error("Failed to fetch all goals:", error)
    }
  }

  async function fetchDisplaySettings() {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        const settings = data.settings || []
        setDisplaySettings({
          showWorkLogTitle: settings.find((s: any) => s.key === 'showWorkLogTitle')?.value === 'true',
          showWorkLogImages: settings.find((s: any) => s.key === 'showWorkLogImages')?.value === 'true',
          showWorkLogDescription: settings.find((s: any) => s.key === 'showWorkLogDescription')?.value === 'true',
        })
      }
    } catch (error) {
      console.error('Failed to fetch display settings:', error)
    }
  }

  async function fetchBackgroundSetting() {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        const bgSetting = data.settings?.find((s: any) => s.key === "backgroundImageUrl")
        if (bgSetting && bgSetting.value) {
          setBackgroundImageUrl(bgSetting.value)
        }
      }
    } catch (error) {
      console.error("Error fetching background setting:", error)
    }
  }

  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < allGoals.length - 1

  function goToPrevious() {
    if (hasPrevious) {
      const urlParams = new URLSearchParams(searchParams.toString())
      router.push(`/kpi/${allGoals[currentIndex - 1].id}?${urlParams.toString()}`)
    }
  }

  function goToNext() {
    if (hasNext) {
      const urlParams = new URLSearchParams(searchParams.toString())
      router.push(`/kpi/${allGoals[currentIndex + 1].id}?${urlParams.toString()}`)
    }
  }

  const formatThaiDate = (date: Date) => {
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
    const day = date.getDate()
    const month = thaiMonths[date.getMonth()]
    const year = date.getFullYear() + 543
    return `${day} ${month} ${year}`
  }

  const filteredWorkLogs = useMemo(() => {
    return selectedUserId === "all"
      ? data?.workLogs || []
      : data?.workLogs.filter((log) => log.user.id === Number.parseInt(selectedUserId)) || []
  }, [data?.workLogs, selectedUserId])

  const monthFilteredWorkLogs = useMemo(() => {
    if (!imageFilterDate) return filteredWorkLogs
    return filteredWorkLogs.filter((log) => {
      const logDate = new Date(log.date)
      return (
        logDate.getFullYear() === imageFilterDate.year &&
        logDate.getMonth() + 1 === imageFilterDate.month
      )
    })
  }, [filteredWorkLogs, imageFilterDate])

  // Flatten images for Masonry Gallery
  const workLogImages = useMemo(() => {
    return monthFilteredWorkLogs.flatMap((log) =>
      (log.images || []).map((img: any) => ({
        ...img,
        log: log,
        sourceType: 'worklog' as const,
      })),
    )
  }, [monthFilteredWorkLogs])

  // Merge work log images + monthly images
  const galleryImages = useMemo(() => {
    const monthlyMapped = monthlyImages.map((img: any) => ({
      id: `monthly-${img.id}`,
      url: img.url,
      sourceType: 'monthly' as const,
      monthlyId: img.id,
      log: {
        user: img.user || { id: img.userId, name: '?', email: '' },
        date: img.createdAt,
      },
      caption: img.caption,
    }))
    return [...workLogImages, ...monthlyMapped]
  }, [workLogImages, monthlyImages])

  const totalProgress = useMemo(() => {
    return filteredWorkLogs.reduce((sum, log) => sum + Number.parseFloat(log.completedWork.toString()), 0)
  }, [filteredWorkLogs])

  const progressPercentage = useMemo(() => {
    return data && data.goal.target > 0 ? (totalProgress / data.goal.target) * 100 : 0
  }, [data, totalProgress])

  const filteredMonthlyData = useMemo(() => {
    return selectedUserId === "all"
      ? monthlyData
      : monthlyData.map((item) => {
        const monthLogs = filteredWorkLogs.filter((log) => {
          const logDate = new Date(log.date)
          const [year, month] = item.month.split("-")
          return (
            logDate.getFullYear() === Number.parseInt(year) &&
            logDate.getMonth() + 1 === Number.parseInt(month)
          )
        })

        if (subMetrics.length > 0) {
          const result: any = { month: item.month }
          subMetrics.forEach((sm) => {
            const total = monthLogs
              .filter((log) => log.subMetricId === sm.id)
              .reduce((sum, log) => sum + Number.parseFloat(log.completedWork.toString()), 0)
            result[sm.name] = total
          })
          result._colors = item._colors
          return result
        } else {
          const total = monthLogs.reduce((sum, log) => sum + Number.parseFloat(log.completedWork.toString()), 0)
          return { ...item, total }
        }
      })
  }, [selectedUserId, monthlyData, filteredWorkLogs, subMetrics])

  const chartData = useMemo(() => {
    return filteredMonthlyData.map((item) => {
      const [year, month] = item.month.split("-")
      const thaiMonths = [
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
      const monthIndex = Number.parseInt(month) - 1
      const buddhistYear = Number.parseInt(year) + 543

      const result: any = {
        month: `${thaiMonths[monthIndex]} ${String(buddhistYear).slice(-2)}`,
      }

      if (subMetrics.length > 0) {
        subMetrics.forEach((sm) => {
          result[sm.name] = item[sm.name] || 0
        })
      } else {
        result.total = item.total || 0
      }

      return result
    })
  }, [filteredMonthlyData, subMetrics])

  const GRADIENT_COLORS = [
    "bg-gradient-to-r from-violet-500 to-indigo-500",
    "bg-gradient-to-r from-pink-500 to-rose-500",
    "bg-gradient-to-r from-teal-500 to-emerald-500",
    "bg-gradient-to-r from-blue-500 to-cyan-500",
    "bg-gradient-to-r from-amber-500 to-orange-500",
  ]

  const gradientClass = data ? GRADIENT_COLORS[data.goal.id % GRADIENT_COLORS.length] : GRADIENT_COLORS[0]

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.reload()
  }



  async function handleDeleteImage(log: any, imageUrl: string) {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้?")) {
      return
    }

    try {
      // Filter out the image to be deleted
      const newImages = (log.images || [])
        .filter((img: any) => img.url !== imageUrl)
        .map((img: any) => img.url)

      const response = await fetch(`/api/worklogs/${log.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completedWork: log.completedWork,
          subMetricId: log.subMetricId,
          subMetricValues: log.subMetricValues,
          description: log.description,
          date: log.date,
          goalId: data?.goal?.id,
          images: newImages,
        }),
      })

      if (!response.ok) {
        throw new Error("ไม่สามารถลบรูปภาพได้")
      }

      await fetchGoalDetails()
      await fetchMonthlyData()
    } catch (error) {
      console.error("Failed to delete image:", error)
      alert("ไม่สามารถลบรูปภาพได้")
    }
  }

  async function handleEditSuccess() {
    await fetchGoalDetails()
    await fetchMonthlyData()
    await fetchMonthlyImages()
  }

  async function fetchMonthlyImages() {
    try {
      const monthNum = Number.parseInt(selectedMonthValue || currentMonth || '1')
      const fy = Number.parseInt(selectedFiscalYear || fiscalYear || '2026')
      const calYear = monthNum >= 10 ? fy - 1 : fy
      const response = await fetch(`/api/monthly-images?month=${monthNum}&year=${calYear}&goalId=${goalId}`)
      if (response.ok) {
        const result = await response.json()
        setMonthlyImages(result.images || [])
      }
    } catch (error) {
      console.error('Failed to fetch monthly images:', error)
    }
  }

  async function handleUploadMonthlyImages() {
    if (pendingUploadFiles.length === 0) return
    try {
      setUploadingMonthly(true)
      const monthNum = Number.parseInt(selectedMonthValue || currentMonth || '1')
      const fy = Number.parseInt(selectedFiscalYear || fiscalYear || '2026')
      const calYear = monthNum >= 10 ? fy - 1 : fy
      const response = await fetch('/api/monthly-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: pendingUploadFiles,
          month: monthNum,
          year: calYear,
          goalId: Number.parseInt(goalId),
        }),
      })
      if (response.ok) {
        setPendingUploadFiles([])
        setShowUploadDialog(false)
        fetchMonthlyImages()
      }
    } catch (error) {
      console.error('Upload monthly images error:', error)
    } finally {
      setUploadingMonthly(false)
    }
  }

  async function handleDeleteMonthlyImage(monthlyId: number) {
    if (!confirm('ต้องการลบรูปภาพนี้ใช่ไหม?')) return
    try {
      const response = await fetch('/api/monthly-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: monthlyId }),
      })
      if (response.ok) {
        setMonthlyImages(prev => prev.filter(img => img.id !== monthlyId))
      }
    } catch (error) {
      console.error('Delete monthly image error:', error)
    }
  }

  const getCurrentFiscalYearAndMonth = () => {
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()
    const fiscalYear = currentMonth >= 10 ? currentYear + 1 : currentYear
    return {
      fiscalYear: fiscalYear.toString(),
      month: currentMonth.toString(),
    }
  }

  const { fiscalYear: defaultFiscalYear, month: defaultMonth } = getCurrentFiscalYearAndMonth()

  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(() => {
    return searchParams.get("fiscalYear") || defaultFiscalYear
  })

  const [selectedMonthValue, setSelectedMonthValue] = useState<string>(() => {
    return searchParams.get("month") || defaultMonth
  })

  const fiscalYearOptions = Array.from({ length: 10 }, (_, i) => 2026 + i)

  const handleFiscalYearChange = (newFiscalYear: string) => {
    setSelectedFiscalYear(newFiscalYear)
    updateURLParams(newFiscalYear, selectedMonthValue)
  }

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonthValue(newMonth)
    updateURLParams(selectedFiscalYear, newMonth)
  }

  const updateURLParams = (fiscalYear: string, month: string) => {
    const monthNum = Number.parseInt(month)
    const fiscalYearNum = Number.parseInt(fiscalYear)
    const calendarYear = monthNum >= 10 ? fiscalYearNum - 1 : fiscalYearNum
    const startYear = fiscalYearNum - 1

    const urlParams = new URLSearchParams()
    urlParams.set("fiscalYear", fiscalYear)
    urlParams.set("month", month)
    urlParams.set("startMonth", "10")
    urlParams.set("startYear", startYear.toString())
    urlParams.set("endMonth", month)
    urlParams.set("endYear", calendarYear.toString())

    router.push(`/kpi/${goalId}?${urlParams.toString()}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-prompt font-light text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-prompt font-light text-muted-foreground mb-4">ไม่พบข้อมูล KPI</p>
          <Button onClick={() => router.push("/")} variant="outline">กลับหน้าแรก</Button>
        </div>
      </div>
    )
  }

  const renderLeftColumn = () => {
    const heroContent = (
      <>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <h1 className="font-prompt font-bold text-3xl md:text-4xl leading-tight">
                {data.goal.title}
              </h1>
              {data.goal.description && (
                <p className="font-prompt font-light text-white/90 text-lg max-w-2xl">
                  {data.goal.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-prompt">
                  <Calendar className="w-4 h-4" />
                  <span>{formatThaiDate(new Date(data.goal.startDate))} - {formatThaiDate(new Date(data.goal.endDate))}</span>
                </div>
              </div>
            </div>

            {userData ? (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const month = Number.parseInt(selectedMonthValue)
                    const fiscalYear = Number.parseInt(selectedFiscalYear)
                    const year = month >= 10 ? fiscalYear - 1 : fiscalYear

                    // Find logs matching month and year
                    const targetLogs = data.workLogs.filter((log) => {
                      const d = new Date(log.date)
                      return d.getMonth() + 1 === month && d.getFullYear() === year
                    })

                    if (targetLogs.length === 0) {
                      alert(`ไม่พบข้อมูลการทำงานในเดือน ${THAI_MONTHS.find(m => m.value === selectedMonthValue)?.label} ${year + 543}`)
                    } else if (targetLogs.length === 1) {
                      setEditingWorkLog(targetLogs[0])
                    } else {
                      alert(`พบข้อมูล ${targetLogs.length} รายการในเดือนนี้ กรุณาเลือกรายการที่ต้องการแก้ไขจากส่วน "แกลเลอรีผลงาน" ด้านล่าง`)
                      // Optional: scroll to gallery
                      document.querySelector('.scroll-area')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 font-prompt shadow-lg"
                  size="lg"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  แก้ไข
                </Button>
                <Button
                  onClick={() => setShowWorkLogForm(true)}
                  className="bg-white text-primary hover:bg-white/90 font-prompt shadow-lg border-0"
                  size="lg"
                >
                  บันทึกการทำงาน
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                className="bg-white/20 hover:bg-white/30 text-white border-0 font-prompt"
              >
                <LogIn className="w-4 h-4 mr-2" />
                เข้าสู่ระบบเพื่อบันทึก
              </Button>
            )}
          </div>
        </div>
      </>
    )

    const progressContent = (
      <>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/50">
          <div className="space-y-1">
            <h3 className="font-prompt font-medium text-muted-foreground">ความคืบหน้าทั้งหมด</h3>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-prompt text-4xl text-primary">
                {totalProgress.toLocaleString()}
              </span>
              <span className="font-prompt text-muted-foreground text-lg">/</span>
              <span className="font-prompt text-4xl text-muted-foreground">
                {data.goal.target.toLocaleString()}
              </span>
              <span className="font-prompt text-muted-foreground text-sm self-end mb-1">
                {data.goal.unit || "ชิ้น"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-prompt text-4xl text-foreground">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        <Progress value={Math.min(progressPercentage, 100)} className="h-4 rounded-full" />

        {userData && data.assignments && data.assignments.length > 1 && (
          <div className="flex items-center gap-3 pt-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="font-prompt text-sm text-muted-foreground">กรองตามบุคคล:</span>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[200px] h-8 font-prompt text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-prompt">ทุกคน</SelectItem>
                {data.assignments.map((assignment) => (
                  <SelectItem key={assignment.user.id} value={assignment.user.id.toString()} className="font-prompt">
                    {assignment.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </>
    )

    const chartContent = (
      <>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-prompt font-semibold text-lg">สถิติรายเดือน</h3>
          {subMetrics.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {subMetrics.map((sm) => (
                <div key={sm.id} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sm.color }} />
                  <span className="font-prompt text-muted-foreground">{sm.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 50, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontFamily: "Prompt" }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontFamily: "Prompt" }}
                axisLine={false}
                tickLine={false}
                dx={-10}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontFamily: "Prompt",
                  color: "var(--popover-foreground)",
                }}
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              />
              {subMetrics.length > 0 ? (
                subMetrics.map((sm) => (
                  <Bar key={sm.id} dataKey={sm.name} fill={sm.color} radius={[0, 0, 0, 0]} stackId="a">
                    <LabelList
                      dataKey={sm.name}
                      position="inside"
                      className="fill-white font-prompt text-xl font-bold drop-shadow-md"
                      formatter={(value: any) => value > 0 ? Number(value).toLocaleString() : ''}
                    />
                  </Bar>
                ))
              ) : (
                <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="total"
                    position="top"
                    className="fill-foreground font-prompt text-2xl font-bold"
                    offset={10}
                    formatter={(value: any) => value > 0 ? Number(value).toLocaleString() : ''}
                  />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>
    )

    if (leftColumnLayout === 'split') {
      return (
        <div className="space-y-8">
          {/* Hero Card */}
          <div className={`${gradientClass} rounded-2xl shadow-lg p-8 relative overflow-hidden text-white`}>
            {heroContent}
          </div>

          {/* Progress Card */}
          <Card className="border-border/50 shadow-sm bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
              {progressContent}
            </CardContent>
          </Card>

          {/* Chart Section */}
          {chartData.length > 0 && (
            <Card className="border-border/50 shadow-sm bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                {chartContent}
              </CardContent>
            </Card>
          )}
        </div>
      )
    }

    // Unified Layout
    return (
      <div className="flex flex-col rounded-2xl overflow-hidden">
        {/* Hero Section */}
        <div className={`${gradientClass} p-8 relative overflow-hidden text-white`}>
          {heroContent}
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-border/50 bg-card/50 backdrop-blur-sm space-y-6">
          {progressContent}
        </div>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <div className="p-6 bg-card/50 backdrop-blur-sm">
            {chartContent}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-background pb-12 transition-colors duration-300 ${backgroundImageUrl ? "bg-cover bg-center bg-fixed" : ""}`}
      style={
        backgroundImageUrl
          ? {
            backgroundImage: `url('${backgroundImageUrl}')`,
          }
          : undefined
      }
    >
      {/* Ambient Background Gradient (only if no image) */}
      {!backgroundImageUrl && (
        <div className="fixed inset-0 -z-10 h-full w-full bg-background">
          <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-[95%]">
        {/* Navigation Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border/50 sticky top-4 z-30 shadow-sm">
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                router.push(`/?${params.toString()}`)
              }}
              className="font-prompt text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground px-2"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              กลับหน้าแรก
            </Button>
            <span className="hidden md:inline-block h-4 w-px bg-border/50 mx-2" />
            <h1 className="hidden md:block font-prompt font-semibold text-lg text-foreground">
              รายงานผลงานข่าวและการสื่อสารดิจิทัล
            </h1>
          </div>

          {/* Date Filters */}
          <div className="flex items-center gap-3">
            <Select value={selectedFiscalYear} onValueChange={handleFiscalYearChange}>
              <SelectTrigger className="h-10 w-28 text-base font-medium font-prompt bg-background/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fiscalYearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="font-prompt text-base">
                    {year + 543}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonthValue} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-10 w-32 text-base font-medium font-prompt bg-background/80">
                <SelectValue>
                  {THAI_MONTHS.find((m) => m.value === selectedMonthValue)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {THAI_MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value} className="font-prompt text-base">
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={!hasPrevious}
              className="font-prompt h-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-prompt text-muted-foreground min-w-[60px] text-center">
              {currentIndex + 1} / {allGoals.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={!hasNext}
              className="font-prompt h-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div className="h-6 w-px bg-border/50 mx-2 hidden md:block" />

            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50 hidden md:flex">
              <Button
                variant={leftColumnLayout === 'split' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={() => setLeftColumnLayout('split')}
                title="แบบเดิม (แยกส่วน)"
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button
                variant={leftColumnLayout === 'unified' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={() => setLeftColumnLayout('unified')}
                title="แบบใหม่ (รวมส่วน)"
              >
                <RectangleVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Layout: 50/50 Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Hero, Progress, Charts */}
          {/* Left Column: Hero, Progress, Charts */}
          {renderLeftColumn()}

          {/* Right Column: Work Log Gallery */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="font-prompt font-semibold text-lg text-foreground">แกลเลอรีผลงาน</h3>
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50">
                  <Button
                    variant={galleryLayout === 'masonry' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7 rounded-md"
                    onClick={() => setGalleryLayout('masonry')}
                    title="แบบเดิม (Masonry)"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={galleryLayout === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7 rounded-md"
                    onClick={() => setGalleryLayout('grid')}
                    title="แบบตาราง (Grid)"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {userData && (
                  <Button
                    size="sm"
                    className="font-prompt h-7 text-xs rounded-lg gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    เพิ่มรูป
                  </Button>
                )}
                <span className="text-xs text-muted-foreground font-prompt bg-muted px-2 py-1 rounded-full">
                  {galleryImages.length} รูปภาพ
                </span>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              {galleryImages.length === 0 ? (
                <div className="text-center py-12 bg-card/50 rounded-xl border border-dashed border-border">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-prompt text-muted-foreground text-sm">ยังไม่มีรูปภาพผลงาน</p>
                </div>
              ) : (
                <>
                  {galleryLayout === 'masonry' ? (
                    <div className="columns-2 gap-4 space-y-4">
                      {galleryImages.map((img, index) => (
                        <div
                          key={`${img.id}-${index}`}
                          className="break-inside-avoid bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-border/50"
                        >
                          <div
                            className="cursor-pointer overflow-hidden"
                            onClick={() => setSelectedImage(img.url)}
                          >
                            <img
                              src={img.url}
                              alt="Work Log Evidence"
                              className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3 flex items-center justify-between gap-2 bg-card/50">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Avatar className="w-6 h-6 border border-border">
                                <AvatarImage src={(img.log.user as any).profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${img.log.user.name}${img.log.user.name === "Chonthicha limpiti" ? "&top[]=longHair&top[]=longHairBob&top[]=longHairCurly&top[]=longHairStraight&facialHairProbability=0" : "&top[]=shortHair&top[]=shortHairTheCaesar&top[]=shortHairShortFlat&top[]=shortHairShortRound&top[]=shortHairShortWaved&facialHairProbability=20"}`} />
                                <AvatarFallback className={AVATAR_COLORS[img.log.user.id % AVATAR_COLORS.length]}>
                                  {img.log.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold font-prompt truncate text-foreground">{img.log.user.name}</span>
                                <span className="text-[9px] text-muted-foreground font-prompt truncate">{formatThaiDate(new Date(img.log.date))}</span>
                              </div>
                            </div>
                            {userData && (userData.role === "ADMIN" || userData.id === img.log.user.id) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-full">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                  {img.sourceType === 'worklog' && (
                                    <DropdownMenuItem onClick={() => setEditingWorkLog(img.log)}>
                                      <Pencil className="w-3.5 h-3.5 mr-2" />
                                      แก้ไข
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => img.sourceType === 'monthly' ? handleDeleteMonthlyImage(img.monthlyId) : handleDeleteImage(img.log, img.url)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    ลบรูปภาพ
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {galleryImages.map((img, index) => (
                        <div
                          key={`${img.id}-${index}`}
                          className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-border/50 flex flex-col h-full"
                        >
                          <div
                            className="cursor-pointer overflow-hidden aspect-[4/3] bg-muted/30 relative flex items-center justify-center p-2"
                            onClick={() => setSelectedImage(img.url)}
                          >
                            <img
                              src={img.url}
                              alt="Work Log Evidence"
                              className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-500 hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3 flex items-center justify-between gap-2 bg-card/50 h-[52px]">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Avatar className="w-6 h-6 border border-border">
                                <AvatarImage src={(img.log.user as any).profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${img.log.user.name}${img.log.user.name === "Chonthicha limpiti" ? "&top[]=longHair&top[]=longHairBob&top[]=longHairCurly&top[]=longHairStraight&facialHairProbability=0" : "&top[]=shortHair&top[]=shortHairTheCaesar&top[]=shortHairShortFlat&top[]=shortHairShortRound&top[]=shortHairShortWaved&facialHairProbability=20"}`} />
                                <AvatarFallback className={AVATAR_COLORS[img.log.user.id % AVATAR_COLORS.length]}>
                                  {img.log.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold font-prompt truncate text-foreground">{img.log.user.name}</span>
                                <span className="text-[9px] text-muted-foreground font-prompt truncate">{formatThaiDate(new Date(img.log.date))}</span>
                              </div>
                            </div>
                            {userData && (userData.role === "ADMIN" || userData.id === img.log.user.id) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-full">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                  {img.sourceType === 'worklog' && (
                                    <DropdownMenuItem onClick={() => setEditingWorkLog(img.log)}>
                                      <Pencil className="w-3.5 h-3.5 mr-2" />
                                      แก้ไข
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => img.sourceType === 'monthly' ? handleDeleteMonthlyImage(img.monthlyId) : handleDeleteImage(img.log, img.url)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    ลบรูปภาพ
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Upload Monthly Images Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open)
        if (!open) setPendingUploadFiles([])
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle className="font-prompt text-foreground">เพิ่มรูปภาพประจำเดือน</DialogTitle>
          <div className="space-y-4 pt-4">
            <ImageUpload
              onChange={(urls) => setPendingUploadFiles(prev => [...prev, ...urls])}
              value={pendingUploadFiles}
              onRemove={(url) => setPendingUploadFiles(prev => prev.filter(u => u !== url))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)} className="font-prompt">ยกเลิก</Button>
              <Button
                onClick={handleUploadMonthlyImages}
                disabled={pendingUploadFiles.length === 0 || uploadingMonthly}
                className="font-prompt gap-2 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {uploadingMonthly ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    บันทึก ({pendingUploadFiles.length} รูป)
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none border-0 sm:max-w-[90vw] sm:max-h-[90vh] sm:w-auto sm:h-auto sm:m-auto sm:rounded-none bg-transparent shadow-none backdrop-blur-none flex flex-col items-center justify-center outline-none overflow-hidden">
            <VisuallyHidden>
              <DialogTitle>Image Preview</DialogTitle>
            </VisuallyHidden>
            <div className="relative flex items-center justify-center p-4 sm:p-0">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-foreground hover:bg-secondary z-50 rounded-full bg-secondary/50 backdrop-blur-sm border border-border/50 shadow-sm"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain drop-shadow-2xl rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showWorkLogForm} onOpenChange={setShowWorkLogForm}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>Add Work Log</DialogTitle>
          </VisuallyHidden>
          <WorkLogFormDialog
            goalId={data.goal.id}
            onSuccess={() => {
              setShowWorkLogForm(false)
              handleEditSuccess()
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingWorkLog} onOpenChange={(open) => !open && setEditingWorkLog(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-background border-border">
          {editingWorkLog && (
            <EditWorkLogForm
              workLog={editingWorkLog}
              onSuccess={() => {
                setEditingWorkLog(null)
                handleEditSuccess()
              }}
              onCancel={() => setEditingWorkLog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
