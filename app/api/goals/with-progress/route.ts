import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/goals/with-progress called")

    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    console.log("[v0] Token found:", !!token)

    if (!token) {
      console.log("[v0] No token, returning 401")
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    console.log("[v0] Token decoded:", !!decoded, "User ID:", decoded?.id, "Role:", decoded?.role)

    if (!decoded) {
      console.log("[v0] Invalid token, returning 401")
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const supabase = await createClient()

    console.log("[v0] Fetching all goals for user:", decoded.id, decoded.role)
    const goalsQuery = supabase.from("Goals").select("*").order("displayOrder", { ascending: true })

    const { data: goals, error: goalsError } = await goalsQuery

    if (goalsError) {
      console.error("[v0] Error fetching goals:", goalsError)
      throw goalsError
    }

    console.log("[v0] Goals fetched:", goals?.length || 0)

    const goalIds = goals?.map((g) => g.id) || []

    if (goalIds.length === 0) {
      console.log("[v0] No goals found, returning empty array")
      return NextResponse.json({ goals: [] })
    }

    const [{ data: assignments }, { data: workLogs }] = await Promise.all([
      supabase
        .from("GoalAssignments")
        .select("id, goalId, userId, assignedTarget, user:Users(id, name, email)")
        .in("goalId", goalIds),
      supabase.from("WorkLogs").select("id, goalId, userId, completedWork, date, description").in("goalId", goalIds),
    ])

    console.log("[v0] Assignments:", assignments?.length || 0, "Work logs:", workLogs?.length || 0)

    // Calculate progress and attach relationships
    const progressMap: Record<number, number> = {}
    workLogs?.forEach((log) => {
      if (!progressMap[log.goalId]) {
        progressMap[log.goalId] = 0
      }
      progressMap[log.goalId] += Number.parseFloat(log.completedWork)
    })

    const goalsWithProgress = goals?.map((goal) => {
      const goalAssignments = assignments?.filter((a) => a.goalId === goal.id) || []
      const assignedUsers = goalAssignments.map((a) => ({
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
        assignedTarget: a.assignedTarget,
      }))

      return {
        ...goal,
        currentProgress: progressMap[goal.id] || 0,
        assignedUsers,
        assignments: goalAssignments,
        workLogs: workLogs?.filter((w) => w.goalId === goal.id) || [],
      }
    })

    console.log("[v0] Returning goals with progress:", goalsWithProgress?.length || 0)
    console.log("[v0] Sample goal with assignedUsers:", goalsWithProgress?.[0]?.assignedUsers)
    return NextResponse.json({ goals: goalsWithProgress || [] })
  } catch (error) {
    console.error("[v0] GET /api/goals/with-progress - Error:", error)
    return NextResponse.json({ message: "Internal server error", error: String(error) }, { status: 500 })
  }
}
