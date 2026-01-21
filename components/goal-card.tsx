"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { formatThaiDateRange } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"
import type { Goal } from "@/types"
import Link from "next/link"

interface GoalCardProps {
  goal: Goal
  progress?: number
  isAdmin?: boolean
  onToggleVisibility?: (id: number, isVisible: boolean) => void
}

export function GoalCard({ goal, progress = 0, isAdmin = false, onToggleVisibility }: GoalCardProps) {
  const progressPercentage = Math.min((progress / goal.target) * 100, 100)
  const isCompleted = progress >= goal.target
  const startDate = new Date(goal.startDate)
  const endDate = new Date(goal.endDate)

  const handleVisibilityClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[v0] GoalCard - Eye icon clicked for goal:", goal.id, "current visibility:", goal.isVisible)
    console.log("[v0] GoalCard - isAdmin:", isAdmin, "onToggleVisibility exists:", !!onToggleVisibility)
    if (onToggleVisibility) {
      console.log("[v0] GoalCard - Calling onToggleVisibility with:", goal.id, !goal.isVisible)
      onToggleVisibility(goal.id, !goal.isVisible)
    } else {
      console.log("[v0] GoalCard - onToggleVisibility is not defined!")
    }
  }

  return (
    <Card
      className={`bg-slate-800/70 backdrop-blur-md border-slate-700/50 hover:shadow-lg transition-shadow ${!goal.isVisible ? "border-dashed opacity-60" : ""}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-prompt text-gray-100">{goal.title}</CardTitle>
              {!goal.isVisible && (
                <span className="bg-slate-700/50 text-gray-300 text-xs font-medium px-2 py-0.5 rounded font-prompt">
                  ซ่อน
                </span>
              )}
            </div>
            {goal.description && (
              <p className="text-sm text-gray-300 mt-1 font-prompt font-light">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <span className="bg-green-900/50 text-green-300 text-xs font-medium px-2.5 py-0.5 rounded font-prompt">
                เสร็จสมบูรณ์
              </span>
            )}
            {isAdmin && onToggleVisibility && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-300 hover:text-gray-100 hover:bg-slate-700/50"
                onClick={handleVisibilityClick}
                title={goal.isVisible ? "ซ่อนจากหน้าแรก" : "แสดงในหน้าแรก"}
              >
                {goal.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300 font-prompt font-light">ความคืบหน้า</span>
            <span className="font-medium font-prompt text-gray-100">
              {progress.toFixed(2)} / {goal.target}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-300 mt-1 font-prompt font-light">
            {progressPercentage.toFixed(1)}% เสร็จสมบูรณ์
          </p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-gray-300 font-prompt font-light">ระยะเวลา</p>
            <p className="font-medium font-prompt text-gray-100">{formatThaiDateRange(startDate, endDate)}</p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="font-prompt bg-slate-700/50 border-slate-600 text-gray-200 hover:bg-slate-600 hover:text-white"
          >
            <Link href={`/goals/${goal.id}`}>ดูรายละเอียด</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
