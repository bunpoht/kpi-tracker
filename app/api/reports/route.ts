import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { createClient } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    console.log("[v0] Fetching reports data for user:", decoded.id, "month:", month, "year:", year)

    const supabase = await createClient()

    const { data: assignments } = await supabase.from("GoalAssignments").select("goalId").eq("userId", decoded.id)

    const goalIds = assignments?.map((a) => a.goalId) || []
    console.log("[v0] User assigned to goals:", goalIds)

    let workLogsQuery = supabase.from("WorkLogs").select("goalId, completedWork, date")

    if (year && month && month !== "all") {
      const lastDay = new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()
      const startDate = `${year}-${month.padStart(2, "0")}-01`
      const endDate = `${year}-${month.padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`
      workLogsQuery = workLogsQuery.gte("date", startDate).lte("date", endDate)
    } else if (year) {
      // Filter by year only
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      workLogsQuery = workLogsQuery.gte("date", startDate).lte("date", endDate)
    }

    const { data: workLogs } = await workLogsQuery

    console.log("[v0] Work logs found:", workLogs?.length || 0)

    const goalTotals = new Map<number, number>()
    workLogs?.forEach((log) => {
      const current = goalTotals.get(log.goalId) || 0
      goalTotals.set(log.goalId, current + Number.parseFloat(log.completedWork || "0"))
    })

    let goalsQuery = supabase.from("Goals").select("*").order("createdAt", { ascending: false })

    if (goalIds.length > 0) {
      goalsQuery = goalsQuery.or(`id.in.(${goalIds.join(",")}),createdById.eq.${decoded.id}`)
    } else {
      goalsQuery = goalsQuery.eq("createdById", decoded.id)
    }

    const { data: goalsData, error: goalsError } = await goalsQuery

    if (goalsError) {
      console.error("[v0] Error fetching goals:", goalsError)
      throw goalsError
    }

    const goals = (goalsData || []).map((goal) => {
      const totalCompleted = goalTotals.get(goal.id) || 0
      const target = Number.parseFloat(goal.target || "0")
      const percentage = target > 0 ? (totalCompleted / target) * 100 : 0

      return {
        ...goal,
        totalCompleted,
        target,
        percentage,
      }
    })

    console.log("[v0] Found goals:", goals.length)

    return NextResponse.json({ goals })
  } catch (error) {
    console.error("[v0] Error fetching reports:", error)
    return NextResponse.json({ message: "Failed to fetch reports", error: String(error) }, { status: 500 })
  }
}
