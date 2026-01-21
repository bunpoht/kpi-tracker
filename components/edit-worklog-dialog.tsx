"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/image-upload"
import { MonthYearInput } from "@/components/ui/month-year-input"
import type { WorkLogWithDetails, Goal } from "@/types"

interface EditWorkLogDialogProps {
  workLog: WorkLogWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditWorkLogDialog({ workLog, open, onOpenChange, onSuccess }: EditWorkLogDialogProps) {
  const handleSuccess = () => {
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <EditWorkLogForm workLog={workLog} onSuccess={handleSuccess} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function EditWorkLogForm({ workLog, onSuccess, onCancel }: { workLog: WorkLogWithDetails, onSuccess: () => void, onCancel: () => void }) {
  const [subMetricValues, setSubMetricValues] = useState<Record<number, string>>({})
  const [completedWork, setCompletedWork] = useState(workLog.completedWork?.toString() || "")
  const [subMetrics, setSubMetrics] = useState<Array<{ id: number; name: string; color: string }>>([])
  const [description, setDescription] = useState(workLog.description || "")
  const [date, setDate] = useState(String(workLog.date).split("T")[0])
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalId, setGoalId] = useState(workLog.goalId?.toString() || "")

  useEffect(() => {
    fetchGoals()
  }, [])

  useEffect(() => {
    setDescription(workLog.description || "")
    setDate(String(workLog.date).split("T")[0])
    setImages(workLog.images?.map((img) => img.url) || [])
    setGoalId(workLog.goalId?.toString() || "")

    if (workLog.goalId) {
      fetchSubMetrics(workLog.goalId.toString(), true)
    }
  }, [workLog])

  async function fetchGoals() {
    try {
      const response = await fetch("/api/goals")
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error)
    }
  }

  async function fetchSubMetrics(targetGoalId: string, isInitialLoad = false) {
    try {
      const response = await fetch(`/api/goals/${targetGoalId}/sub-metrics`)
      if (response.ok) {
        const data = await response.json()
        setSubMetrics(data.subMetrics || [])

        if (isInitialLoad && workLog.subMetricValues && targetGoalId === workLog.goalId?.toString()) {
          // New format: has subMetricValues JSONB
          const values: Record<number, string> = {}
          Object.entries(workLog.subMetricValues).forEach(([subMetricId, value]) => {
            values[Number(subMetricId)] = String(value)
          })
          setSubMetricValues(values)
          setCompletedWork("")
        } else if (isInitialLoad && !workLog.subMetricValues && targetGoalId === workLog.goalId?.toString()) {
          // Old format: single completedWork
          setCompletedWork(workLog.completedWork?.toString() || "")
          const initialValues: Record<number, string> = {}
          data.subMetrics?.forEach((sm: any) => {
            initialValues[sm.id] = ""
          })
          setSubMetricValues(initialValues)
        } else {
          // Goal changed or no initial data, reset values
          const initialValues: Record<number, string> = {}
          data.subMetrics?.forEach((sm: any) => {
            initialValues[sm.id] = ""
          })
          setSubMetricValues(initialValues)
          setCompletedWork("")
        }
      } else {
        setSubMetrics([])
        if (isInitialLoad && targetGoalId === workLog.goalId?.toString()) {
          setCompletedWork(workLog.completedWork?.toString() || "")
        } else {
          setCompletedWork("")
        }
      }
    } catch (error) {
      console.error("Failed to fetch sub-metrics:", error)
      setSubMetrics([])
      setCompletedWork("")
    }
  }

  const handleGoalChange = (newGoalId: string) => {
    setGoalId(newGoalId)
    fetchSubMetrics(newGoalId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let bodyData: any = {
        goalId: Number(goalId),
        description,
        date,
        images,
      }

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

        bodyData.subMetricValues = subMetricValuesObj
      } else {
        if (completedWork === "" || parseFloat(completedWork) < 0) {
          throw new Error("กรุณากรอกผลงานที่ทำเสร็จ")
        }
        bodyData.completedWork = parseFloat(completedWork)
      }

      console.log("Submitting edit worklog:", bodyData)

      const response = await fetch(`/api/worklogs/${workLog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "ไม่สามารถแก้ไขบันทึกได้")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-prompt text-foreground">แก้ไขบันทึกการทำงาน</DialogTitle>
        <DialogDescription className="font-prompt font-light text-muted-foreground">แก้ไขข้อมูลบันทึกการทำงานของคุณ</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal" className="font-prompt text-foreground">
            เป้าหมาย
          </Label>
          <Select value={goalId} onValueChange={handleGoalChange}>
            <SelectTrigger className="font-prompt bg-background border-input text-foreground">
              <SelectValue placeholder="เลือกเป้าหมาย" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id.toString()} className="font-prompt">
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {subMetrics.length > 0 ? (
          <div className="space-y-3">
            <Label className="font-prompt text-foreground">ผลงานที่ทำเสร็จ</Label>
            {subMetrics.map((subMetric) => (
              <div key={subMetric.id} className="space-y-2">
                <Label htmlFor={`subMetric-${subMetric.id}`} className="font-prompt text-sm flex items-center gap-2 text-foreground">
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
                  className="font-prompt bg-background border-input text-foreground"
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
              min="0"
              placeholder="ระบุจำนวน"
              value={completedWork}
              onChange={(e) => setCompletedWork(e.target.value)}
              required
              className="font-prompt bg-background border-input text-foreground"
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
            className="font-prompt bg-background border-input text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-prompt text-foreground">รูปภาพ (ไม่บังคับ)</Label>
          <ImageUpload images={images} onImagesChange={setImages} maxImages={5} />
        </div>
        {error && <p className="text-sm text-destructive font-prompt">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="font-prompt">
            ยกเลิก
          </Button>
          <Button type="submit" disabled={loading} className="font-prompt bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </form>
    </>
  )
}
