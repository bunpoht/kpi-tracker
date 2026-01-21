"use client"

import { useEffect, useState, useMemo } from "react"
import { GoalCard } from "@/components/goal-card"
import { CreateGoalDialog } from "@/components/create-goal-dialog"
import type { Goal } from "@/types"
import { useAuth } from "@/app/context/AuthContext"
import { Target, Plus, Search, LayoutGrid } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface GoalWithProgress extends Goal {
  currentProgress?: number
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [viewFilter, setViewFilter] = useState<"own" | "all">("own")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  async function fetchGoals() {
    try {
      const response = await fetch("/api/goals/with-progress", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        const goalsWithProgress = data.goals.map((goal: any) => ({
          ...goal,
          currentProgress: goal.currentProgress || 0,
        }))
        setGoals(goalsWithProgress)
      } else {
        if (response.status === 401) {
          router.push("/login")
        }
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleVisibility(id: number, isVisible: boolean) {
    if (user?.role !== "ADMIN") {
      return
    }

    try {
      const response = await fetch(`/api/goals/${id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible }),
        credentials: "include",
      })

      if (response.ok) {
        setGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, isVisible } : goal)))
      }
    } catch (error) {
      console.error("Error toggling visibility:", error)
    }
  }

  const filteredGoals = useMemo(() => {
    let filtered = goals

    // Apply view filter (own vs all)
    if (viewFilter === "own" && user) {
      // Show goals where user is assigned or is the creator
      filtered = filtered.filter(
        (goal) => goal.createdById === user.id || goal.assignedUsers?.some((u) => u.id === user.id),
      )
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (goal) =>
          goal.title?.toLowerCase().includes(query) ||
          goal.description?.toLowerCase().includes(query) ||
          goal.assignedUsers?.some((u) => u.name?.toLowerCase().includes(query)),
      )
    }

    return filtered
  }, [goals, viewFilter, searchQuery, user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-prompt font-light text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background/50">
      <div className="container mx-auto px-6 py-8 max-w-[98%] space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border/40">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-prompt">
              KPI Management
            </h1>
            <p className="text-sm text-muted-foreground font-prompt font-light mt-1">
              Manage and track your team's goals
            </p>
          </div>
          <CreateGoalDialog onSuccess={fetchGoals}>
            <Button className="font-prompt shadow-sm bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" /> Create New KPI
            </Button>
          </CreateGoalDialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search KPIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-border/60 font-prompt focus:ring-primary"
            />
          </div>
          <Select value={viewFilter} onValueChange={(value: "own" | "all") => setViewFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white border-border/60 font-prompt">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="own" className="font-prompt">
                My KPIs
              </SelectItem>
              <SelectItem value="all" className="font-prompt">
                All KPIs
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-dashed border-border/40">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
              <LayoutGrid className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-semibold text-foreground font-prompt mb-2">No KPIs Found</h3>
            <p className="text-muted-foreground font-prompt mb-8 text-center max-w-md font-light">
              {searchQuery ? "No KPIs match your search." : "Get started by creating your first KPI."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                progress={goal.currentProgress || 0}
                isAdmin={user?.role === "ADMIN"}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
