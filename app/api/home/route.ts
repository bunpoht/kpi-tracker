import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] /api/home called")
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    console.log("[v0] Date params - startDate:", startDate, "endDate:", endDate)

    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    let user = null

    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        user = payload
      }
    }

    console.log("[v0] User session:", user ? `Logged in as ${user.role}` : "Guest")

    const supabase = await createClient()

    // Fetch settings to check if hidden cards should be shown
    const { data: settings } = await supabase
      .from("Settings")
      .select("value")
      .eq("key", "showHiddenCards")
      .single()

    const showHiddenCards = settings?.value === "true"
    const shouldShowHidden = !!user && showHiddenCards

    console.log("[v0] Visibility logic - showHiddenCards setting:", showHiddenCards, "shouldShowHidden:", shouldShowHidden)
    console.log("[v0] API Debug - Settings showHiddenCards:", settings?.value)
    console.log("[v0] API Debug - shouldShowHidden:", shouldShowHidden)

    let goalsQuery = supabase
      .from("Goals")
      .select("*")
      .order("displayOrder", { ascending: true })

    if (!shouldShowHidden) {
      goalsQuery = goalsQuery.eq("isVisible", true)
    }

    const { data: goals, error: goalsError } = await goalsQuery

    if (goalsError) {
      console.error("[v0] Error fetching goals:", goalsError)
      return NextResponse.json({ message: "Failed to fetch goals" }, { status: 500 })
    }

    console.log("[v0] Fetched goals from database:", goals?.length || 0)
    console.log(
      "[v0] Goals:",
      goals?.map((g) => ({ id: g.id, title: g.title, displayOrder: g.displayOrder, isVisible: g.isVisible })),
    )

    if (!goals || goals.length === 0) {
      return NextResponse.json({ goals: [] })
    }

    const { data: assignments, error: assignmentsError } = await supabase
      .from("GoalAssignments")
      .select("goalId, userId")
      .in(
        "goalId",
        goals.map((g) => g.id),
      )

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError)
    }

    const userIds = [...new Set(assignments?.map((a) => a.userId) || [])]
    const { data: users, error: usersError } =
      userIds.length > 0
        ? await supabase.from("Users").select("id, name, profilePicture").in("id", userIds)
        : { data: null, error: null }

    if (usersError) {
      console.error("Error fetching users:", usersError)
    }

    let workLogsQuery = supabase.from("WorkLogs").select("goalId, completedWork, subMetricValues, date")

    if (startDate && endDate) {
      workLogsQuery = workLogsQuery.gte("date", startDate).lte("date", endDate)
    }

    const { data: workLogs, error: workLogsError } = await workLogsQuery

    if (workLogsError) {
      console.error("Error fetching work logs:", workLogsError)
      // Continue with empty work logs instead of failing
    }

    // Calculate progress for each goal
    const goalsWithProgress = goals.map((goal) => {
      const goalWorkLogs = workLogs?.filter((log) => log.goalId === goal.id) || []

      const totalProgress = goalWorkLogs.reduce((sum, log) => {
        // If work log has subMetricValues, sum all sub-metric values
        if (log.subMetricValues && typeof log.subMetricValues === 'object') {
          const subMetricTotal = Object.values(log.subMetricValues).reduce(
            (subSum: number, value: any) => subSum + Number.parseFloat(String(value)),
            0
          )
          return sum + subMetricTotal
        }
        // Otherwise use completedWork (backward compatible)
        return sum + Number.parseFloat(log.completedWork.toString())
      }, 0)

      const percentage = Math.min((totalProgress / goal.target) * 100, 100)

      const goalAssignments = assignments?.filter((a) => a.goalId === goal.id) || []
      const assignedUsers = goalAssignments
        .map((a) => users?.find((u) => u.id === a.userId))
        .filter((u) => u !== undefined)
        .map((u) => ({ id: u!.id, name: u!.name, profilePicture: u!.profilePicture }))

      return {
        id: goal.id,
        title: goal.title,
        target: goal.target,
        unit: goal.unit || "ชิ้น",
        progress: totalProgress,
        percentage: Math.round(percentage * 100) / 100,
        displayOrder: goal.displayOrder || goal.id,
        isVisible: goal.isVisible !== false,
        assignedUsers,
      }
    })

    return NextResponse.json({ goals: goalsWithProgress })
  } catch (error) {
    console.error("[v0] Error in home API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
