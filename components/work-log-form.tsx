"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/image-upload"
import { MonthYearInput } from "@/components/ui/month-year-input"
import { Checkbox } from "@/components/ui/checkbox"
import type { Goal } from "@/types"
import { useAuth } from "@/app/context/AuthContext"
import { CheckCircle2, Save } from "lucide-react"

interface WorkLogFormProps {
  goals: Goal[]
  onSuccess: () => void
}

export function WorkLogForm({ goals, onSuccess }: WorkLogFormProps) {
  const { user } = useAuth()
  const [goalId, setGoalId] = useState("")
  const [subMetricValues, setSubMetricValues] = useState<Record<number, string>>({})
  const [subMetrics, setSubMetrics] = useState<Array<{ id: number; name: string; color: string }>>([])
  const [completedWork, setCompletedWork] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  })
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAllGoals, setShowAllGoals] = useState(false)

  const filteredGoals = goals.filter((goal) => {
    if (showAllGoals) return true
    return goal.createdById === user?.id || goal.assignedUsers?.some((u) => u.id === user?.id)
  })

  useEffect(() => {
    if (goalId) {
      fetchSubMetrics(goalId)
    } else {
      setSubMetrics([])
      setSubMetricValues({})
    }
  }, [goalId])

  async function fetchSubMetrics(goalId: string) {
    try {
      const response = await fetch(`/api/goals/${goalId}/sub-metrics`)
      if (response.ok) {
        const data = await response.json()
        setSubMetrics(data.subMetrics || [])
        const initialValues: Record<number, string> = {}
        data.subMetrics?.forEach((sm: any) => {
          initialValues[sm.id] = ""
        })
        setSubMetricValues(initialValues)
      }
    } catch (error) {
      console.error("Failed to fetch sub-metrics:", error)
      setSubMetrics([])
      setSubMetricValues({})
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (subMetrics.length > 0) {
        const subMetricValuesObj: Record<string, number> = {}
        Object.entries(subMetricValues).forEach(([subMetricId, value]) => {
          if (value !== "") {
            subMetricValuesObj[subMetricId] = Number.parseFloat(value)
          }
        })

        if (Object.keys(subMetricValuesObj).length === 0) {
          throw new Error("กรุณากรอกจำนวนอย่างน้อย 1 ตัวชี้วัด")
        }

        const response = await fetch("/api/worklogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalId,
            subMetricValues: subMetricValuesObj,
            description,
            date,
            images,
          }),
        })

        if (!response.ok) throw new Error("Failed to save work log")
      } else {
        if (!completedWork && completedWork !== "0") {
          throw new Error("กรุณาระบุผลงานที่ทำเสร็จ")
        }

        const response = await fetch("/api/worklogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalId,
            completedWork: Number.parseFloat(completedWork),
            description,
            date,
            images,
          }),
        })

        if (!response.ok) throw new Error("Failed to save work log")
      }

      // Reset form
      setGoalId("")
      setCompletedWork("")
      setDescription("")
      setImages([])
      setSubMetricValues({})
      onSuccess()
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showAllGoals"
            checked={showAllGoals}
            onCheckedChange={(checked) => setShowAllGoals(checked as boolean)}
            className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <label
            htmlFor="showAllGoals"
            className="text-sm font-prompt font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
          >
            แสดงเป้าหมายทั้งหมด
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="goal" className="font-prompt text-foreground font-medium">
            เป้าหมาย <span className="text-red-500">*</span>
          </Label>
          <Select value={goalId} onValueChange={setGoalId}>
            <SelectTrigger className="font-prompt bg-background border-input text-foreground h-11 focus:ring-primary/20">
              <SelectValue placeholder="เลือกเป้าหมายที่ต้องการบันทึก" />
            </SelectTrigger>
            <SelectContent>
              {filteredGoals.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground font-prompt">
                  ไม่พบเป้าหมายที่ได้รับมอบหมาย
                </div>
              ) : (
                filteredGoals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id.toString()} className="font-prompt cursor-pointer">
                    {goal.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date" className="font-prompt text-foreground font-medium">
            เดือนของการรายงาน <span className="text-red-500">*</span>
          </Label>
          <MonthYearInput
            id="date"
            value={date}
            onChange={setDate}
            placeholder="เลือกเดือนและปี"
            required
            className="h-11"
          />
        </div>
      </div>

      {subMetrics.length > 0 ? (
        <div className="space-y-4 bg-secondary/10 p-4 rounded-lg border border-border/50">
          <Label className="font-prompt text-foreground font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            ผลงานที่ทำเสร็จ
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subMetrics.map((subMetric) => (
              <div key={subMetric.id} className="space-y-2">
                <Label htmlFor={`subMetric-${subMetric.id}`} className="font-prompt text-sm flex items-center gap-2 text-foreground">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: subMetric.color }} />
                  {subMetric.name}
                </Label>
                <Input
                  id={`subMetric-${subMetric.id}`}
                  type="number"
                  step="0.01"
                  placeholder="ระบุจำนวน"
                  value={subMetricValues[subMetric.id] || ""}
                  onChange={(e) => setSubMetricValues(prev => ({ ...prev, [subMetric.id]: e.target.value }))}
                  className="font-prompt bg-background border-input text-foreground h-10 focus:ring-primary/20"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="completedWork" className="font-prompt text-foreground font-medium">
            ผลงานที่ทำเสร็จ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="completedWork"
            type="number"
            step="0.01"
            min="0"
            placeholder="ระบุจำนวนหน่วยที่ทำได้"
            value={completedWork}
            onChange={(e) => setCompletedWork(e.target.value)}
            required={!subMetrics.length}
            disabled={!goalId}
            className="font-prompt bg-background border-input text-foreground h-11 focus:ring-primary/20"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description" className="font-prompt text-foreground font-medium">
          รายละเอียดเพิ่มเติม (ไม่บังคับ)
        </Label>
        <Textarea
          id="description"
          placeholder="เพิ่มหมายเหตุหรือรายละเอียดเกี่ยวกับงานของคุณ..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="font-prompt bg-background border-input text-foreground resize-none focus:ring-primary/20 min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-prompt text-foreground font-medium">รูปภาพประกอบ (ไม่บังคับ)</Label>
        <div className="bg-secondary/5 rounded-lg border border-dashed border-border p-4">
          <ImageUpload images={images} onImagesChange={setImages} maxImages={5} />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md font-prompt flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-destructive rounded-full"></span>
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-border/50">
        <Button
          type="button"
          variant="outline"
          className="font-prompt h-11 px-6"
          onClick={() => {
            setGoalId("")
            setCompletedWork("")
            setDescription("")
            setImages([])
            setSubMetricValues({})
          }}
        >
          ล้างข้อมูล
        </Button>
        <Button
          type="submit"
          className="font-prompt h-11 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              กำลังบันทึก...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              บันทึกข้อมูล
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}
