"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Calendar } from "lucide-react"
import { MonthYearInput } from "@/components/ui/month-year-input"
import type { User } from "@/types"

interface CreateGoalDialogProps {
  onSuccess: () => void
}

interface Assignment {
  userId: number
  assignedTarget: string
}

interface SubMetricInput {
  name: string
  color: string
}

export function CreateGoalDialog({ onSuccess }: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [unit, setUnit] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [assignments, setAssignments] = useState<Assignment[]>([{ userId: 0, assignedTarget: "" }])
  const [subMetrics, setSubMetrics] = useState<SubMetricInput[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error("Error fetching users:", err)
    }
  }

  function addAssignment() {
    setAssignments([...assignments, { userId: 0, assignedTarget: "" }])
  }

  function removeAssignment(index: number) {
    if (assignments.length > 1) {
      setAssignments(assignments.filter((_, i) => i !== index))
    }
  }

  function updateAssignment(index: number, field: keyof Assignment, value: string | number) {
    const updated = [...assignments]
    updated[index] = { ...updated[index], [field]: value }
    setAssignments(updated)
  }

  function addSubMetric() {
    const colors = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"]
    const nextColor = colors[subMetrics.length % colors.length]
    setSubMetrics([...subMetrics, { name: "", color: nextColor }])
  }

  function removeSubMetric(index: number) {
    setSubMetrics(subMetrics.filter((_, i) => i !== index))
  }

  function updateSubMetric(index: number, field: keyof SubMetricInput, value: string) {
    const updated = [...subMetrics]
    updated[index] = { ...updated[index], [field]: value }
    setSubMetrics(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const validAssignments = assignments.filter((a) => a.userId > 0 && a.assignedTarget)
    const validSubMetrics = subMetrics.filter((sm) => sm.name.trim())
    if (validSubMetrics.length > 0 && validSubMetrics.some((sm) => !sm.name.trim())) {
      setError("Please fill in all sub-metric names or remove empty ones")
      return
    }

    const totalTarget = validAssignments.reduce((sum, a) => sum + Number.parseFloat(a.assignedTarget), 0)

    console.log("[v0] Creating goal with calculated target:", totalTarget)

    setLoading(true)

    try {
      const payload = {
        title,
        description,
        target: totalTarget,
        unit,
        startDate,
        endDate,
        assignments: validAssignments.map((a) => ({
          userId: a.userId,
          assignedTarget: Number.parseFloat(a.assignedTarget),
        })),
        subMetrics: validSubMetrics.length > 0 ? validSubMetrics : undefined,
      }

      console.log("[v0] Sending create goal request:", payload)

      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      console.log("[v0] Create goal response status:", response.status)
      const contentType = response.headers.get("content-type")
      console.log("[v0] Response content-type:", contentType)

      if (!response.ok) {
        if (contentType?.includes("application/json")) {
          const error = await response.json()
          console.error("[v0] Create goal error:", error)
          throw new Error(error.message || "Failed to create goal")
        } else {
          const text = await response.text()
          console.error("[v0] Create goal HTML error:", text.substring(0, 200))
          throw new Error(`Server error: ${response.status}`)
        }
      }

      if (!contentType?.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Expected JSON but got:", text.substring(0, 200))
        throw new Error("Server returned invalid response format")
      }

      const result = await response.json()
      console.log("[v0] Goal created successfully:", result)

      // Reset form
      setTitle("")
      setDescription("")
      setUnit("")
      setStartDate("")
      setEndDate("")
      setAssignments([{ userId: 0, assignedTarget: "" }])
      setSubMetrics([])
      setOpen(false)
      onSuccess()
    } catch (err: any) {
      console.error("[v0] Create goal exception:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-prompt">สร้างเป้าหมายใหม่</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-prompt">เพิ่มเป้าหมาย / KPI ใหม่</DialogTitle>
          <DialogDescription className="font-prompt font-light">
            สร้างเป้าหมายใหม่และกำหนดเป้าหมายให้กับสมาชิกในทีม
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Details Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg font-prompt">รายละเอียดเป้าหมาย</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-prompt">
                  ชื่อเป้าหมาย
                </Label>
                <Input
                  id="title"
                  placeholder="ชื่อเป้าหมาย"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="font-prompt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit" className="font-prompt">
                  หน่วย (เช่น ชิ้น)
                </Label>
                <Input
                  id="unit"
                  placeholder="หน่วย (เช่น ชิ้น)"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  className="font-prompt"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="font-prompt">
                  วันที่เริ่มต้น
                </Label>
                <MonthYearInput
                  id="startDate"
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="เลือกเดือน/ปีเริ่มต้น"
                  type="start"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="font-prompt">
                  วันที่สิ้นสุด
                </Label>
                <MonthYearInput
                  id="endDate"
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="เลือกเดือน/ปีสิ้นสุด"
                  type="end"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="font-prompt">
                รายละเอียด (ไม่บังคับ)
              </Label>
              <Textarea
                id="description"
                placeholder="อธิบายเป้าหมาย..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="font-prompt"
              />
            </div>
          </div>

          {/* Assignees & Targets Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg font-prompt">ผู้รับผิดชอบและเป้าหมาย</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAssignment}
                className="font-prompt bg-transparent"
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มผู้รับผิดชอบ
              </Button>
            </div>
            <div className="space-y-3">
              {assignments.map((assignment, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`assignee-${index}`} className="font-prompt">
                      ผู้รับผิดชอบ
                    </Label>
                    <Select
                      value={assignment.userId.toString()}
                      onValueChange={(value) => updateAssignment(index, "userId", Number.parseInt(value))}
                    >
                      <SelectTrigger id={`assignee-${index}`} className="font-prompt">
                        <SelectValue placeholder="เลือกผู้ใช้" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()} className="font-prompt">
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`target-${index}`} className="font-prompt">
                      เป้าหมาย
                    </Label>
                    <Input
                      id={`target-${index}`}
                      type="number"
                      step="0.01"
                      placeholder="เป้าหมาย"
                      value={assignment.assignedTarget}
                      onChange={(e) => updateAssignment(index, "assignedTarget", e.target.value)}
                      required
                      className="font-prompt"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-8"
                    onClick={() => removeAssignment(index)}
                    disabled={assignments.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-Metrics Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg font-prompt">ตัวชี้วัดย่อย (ไม่บังคับ)</h3>
                <p className="text-sm text-gray-500 font-prompt font-light">สำหรับ KPI ที่มีหลายตัวชี้วัด เช่น ข่าว และบทความ</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubMetric}
                className="font-prompt bg-transparent"
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มตัวชี้วัด
              </Button>
            </div>
            {subMetrics.length > 0 && (
              <div className="space-y-3">
                {subMetrics.map((subMetric, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <div className="flex-1">
                      <Input
                        placeholder="ชื่อตัวชี้วัด เช่น ข่าว, บทความ"
                        value={subMetric.name}
                        onChange={(e) => updateSubMetric(index, "name", e.target.value)}
                        required
                        className="font-prompt"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={subMetric.color}
                        onChange={(e) => updateSubMetric(index, "color", e.target.value)}
                        className="w-20 h-9 cursor-pointer"
                        title="เลือกสี"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSubMetric(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 font-prompt">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-prompt">
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading} className="font-prompt">
              {loading ? "กำลังบันทึก..." : "บันทึกเป้าหมาย"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
