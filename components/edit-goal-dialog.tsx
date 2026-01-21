"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { MonthYearInput } from "@/components/ui/month-year-input"
import type { Goal, GoalAssignment } from "@/types"

interface User {
  id: number
  name: string
  email: string
}

interface SubMetricInput {
  id?: number
  name: string
  color: string
}

interface EditGoalDialogProps {
  goal: Goal
  assignments: (GoalAssignment & { user: User })[]
  onSuccess: () => void
}

export function EditGoalDialog({ goal, assignments, onSuccess }: EditGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    title: goal.title,
    description: goal.description || "",
    unit: goal.unit || "",
    startDate: new Date(goal.startDate).toISOString().split("T")[0],
    endDate: new Date(goal.endDate).toISOString().split("T")[0],
  })
  const [assignees, setAssignees] = useState<Array<{ userId: number; assignedTarget: string }>>(
    assignments.map((a) => ({ userId: a.userId, assignedTarget: a.assignedTarget.toString() })),
  )
  const [subMetrics, setSubMetrics] = useState<SubMetricInput[]>([])

  useEffect(() => {
    if (open) {
      fetchUsers()
      fetchSubMetrics()
    }
  }, [open])

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  async function fetchSubMetrics() {
    try {
      const response = await fetch(`/api/goals/${goal.id}/sub-metrics`)
      if (response.ok) {
        const data = await response.json()
        setSubMetrics(data.subMetrics || [])
      }
    } catch (error) {
      console.error("Failed to fetch sub-metrics:", error)
    }
  }

  function addAssignee() {
    setAssignees([...assignees, { userId: 0, assignedTarget: "" }])
  }

  function removeAssignee(index: number) {
    setAssignees(assignees.filter((_, i) => i !== index))
  }

  function updateAssignee(index: number, field: "userId" | "assignedTarget", value: string) {
    const updated = [...assignees]
    if (field === "userId") {
      updated[index].userId = Number.parseInt(value)
    } else {
      updated[index].assignedTarget = value
    }
    setAssignees(updated)
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
    setLoading(true)

    try {
      const validAssignees = assignees.filter((a) => a.userId > 0 && a.assignedTarget)
      const totalTarget = validAssignees.reduce((sum, a) => sum + Number.parseFloat(a.assignedTarget), 0)

      const validSubMetrics = subMetrics.filter((sm) => sm.name.trim())

      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          target: totalTarget,
          assignments: validAssignees,
          subMetrics: validSubMetrics.length > 0 ? validSubMetrics : undefined,
        }),
      })

      if (response.ok) {
        setOpen(false)
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.message || "Failed to update goal")
      }
    } catch (error) {
      console.error("Update goal error:", error)
      alert("Failed to update goal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Goal / KPI</DialogTitle>
          <DialogDescription>Update the goal details and team assignments</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Goal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Goal Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit (e.g., ชิ้น)</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="ชิ้น, kg, hours"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <MonthYearInput
                  id="edit-startDate"
                  value={formData.startDate}
                  onChange={(value) => setFormData({ ...formData, startDate: value })}
                  placeholder="เลือกเดือน/ปีเริ่มต้น"
                  type="start"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <MonthYearInput
                  id="edit-endDate"
                  value={formData.endDate}
                  onChange={(value) => setFormData({ ...formData, endDate: value })}
                  placeholder="เลือกเดือน/ปีสิ้นสุด"
                  type="end"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Assignees & Targets</h3>
              <Button type="button" variant="outline" size="sm" onClick={addAssignee}>
                <Plus className="h-4 w-4 mr-2" />
                Add Assignee
              </Button>
            </div>
            <div className="space-y-3">
              {assignees.map((assignee, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Select
                      value={assignee.userId.toString()}
                      onValueChange={(value) => updateAssignee(index, "userId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Target"
                      value={assignee.assignedTarget}
                      onChange={(e) => updateAssignee(index, "assignedTarget", e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeAssignee(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {assignees.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No assignees yet. Click "Add Assignee" to start.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Sub-Metrics (Optional)</h3>
                <p className="text-sm text-gray-500">For KPIs with multiple indicators like News and Articles</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSubMetric}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sub-Metric
              </Button>
            </div>
            {subMetrics.length > 0 && (
              <div className="space-y-3">
                {subMetrics.map((subMetric, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <div className="flex-1">
                      <Input
                        placeholder="Sub-metric name (e.g., News, Articles)"
                        value={subMetric.name}
                        onChange={(e) => updateSubMetric(index, "name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={subMetric.color}
                        onChange={(e) => updateSubMetric(index, "color", e.target.value)}
                        className="w-20 h-9 cursor-pointer"
                        title="Choose color"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSubMetric(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
