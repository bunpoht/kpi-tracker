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
import type { Goal } from "@/types"
import { Calendar } from "lucide-react"

interface WorkLogFormDialogProps {
  goalId: number
  onSuccess: () => void
}

export function WorkLogFormDialog({ goalId, onSuccess }: WorkLogFormDialogProps) {
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
  const [goal, setGoal] = useState<Goal | null>(null)

  useEffect(() => {
    fetchGoalAndSubMetrics()
  }, [goalId])

  async function fetchGoalAndSubMetrics() {
    try {
      const [goalResponse, subMetricsResponse] = await Promise.all([
        fetch(`/api/goals/${goalId}`),
        fetch(`/api/goals/${goalId}/sub-metrics`)
      ])

      if (goalResponse.ok) {
        const goalData = await goalResponse.json()
        setGoal(goalData.goal)
      }

      if (subMetricsResponse.ok) {
        const data = await subMetricsResponse.json()
        setSubMetrics(data.subMetrics || [])
        const initialValues: Record<number, string> = {}
        data.subMetrics?.forEach((sm: any) => {
          initialValues[sm.id] = ""
        })
        setSubMetricValues(initialValues)
      }
    } catch (error) {
      console.error("Failed to fetch goal and sub-metrics:", error)
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
            goalId: goalId.toString(),
            subMetricValues: subMetricValuesObj,
            description,
            date,
            images,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "ไม่สามารถบันทึกได้")
        }
      } else {
        const response = await fetch("/api/worklogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalId: goalId.toString(),
            completedWork,
            description,
            date,
            images,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "ไม่สามารถบันทึกได้")
        }
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-prompt font-bold text-foreground">บันทึกการทำงาน</h2>
      {goal && (
        <p className="font-prompt text-muted-foreground text-sm">เป้าหมาย: {goal.title}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {subMetrics.length > 0 ? (
          <div className="space-y-3">
            {subMetrics.map((subMetric) => (
              <div key={subMetric.id} className="space-y-2">
                <Label htmlFor={`subMetric-${subMetric.id}`} className="font-prompt text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: subMetric.color }} />
                  {subMetric.name}
                </Label>
                <Input
                  id={`subMetric-${subMetric.id}`}
                  type="number"
                  step="0.01"
                  placeholder="ระบุจำนวน (ถ้าไม่มีให้ใส่ 0 หรือเว้นว่าง)"
                  value={subMetricValues[subMetric.id] || ""}
                  onChange={(e) => setSubMetricValues(prev => ({ ...prev, [subMetric.id]: e.target.value }))}
                  className="font-prompt bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="completedWork" className="font-prompt text-foreground">
              ผลงานที่ทำเสร็จ
            </Label>
            <Input
              id="completedWork"
              type="number"
              step="0.01"
              placeholder="ระบุจำนวน"
              value={completedWork}
              onChange={(e) => setCompletedWork(e.target.value)}
              required
              className="font-prompt bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="date" className="font-prompt text-foreground">
            เดือนของการรายงาน
          </Label>
          <MonthYearInput id="date" value={date} onChange={setDate} placeholder="เลือกเดือนและปี" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="font-prompt text-foreground">
            รายละเอียด (ไม่บังคับ)
          </Label>
          <Textarea
            id="description"
            placeholder="เพิ่มหมายเหตุเกี่ยวกับงานของคุณ..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="font-prompt bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-prompt text-foreground">รูปภาพ (ไม่บังคับ)</Label>
          <ImageUpload images={images} onImagesChange={setImages} maxImages={5} />
        </div>

        {error && <p className="text-sm text-destructive font-prompt">{error}</p>}

        <Button
          type="submit"
          className="w-full font-prompt bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={loading}
        >
          {loading ? "กำลังบันทึก..." : "บันทึกการทำงาน"}
        </Button>
      </form>
    </div>
  )
}
