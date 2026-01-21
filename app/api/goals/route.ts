import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  console.log("[v0] GET /api/goals - Called")
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    console.log("[v0] GET /api/goals - Token exists:", !!token)

    if (!token) {
      console.log("[v0] GET /api/goals - No token, returning 401")
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    console.log("[v0] GET /api/goals - Token decoded:", !!decoded, decoded?.id, decoded?.role)

    if (!decoded) {
      console.log("[v0] GET /api/goals - Invalid token, returning 401")
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const supabase = await createClient()

    console.log("[v0] GET /api/goals - Fetching all goals for user:", decoded.id, decoded.role)

    const { data: goals, error: goalsError } = await supabase
      .from("Goals")
      .select("*")
      .order("displayOrder", { ascending: true })

    if (goalsError) {
      console.log("[v0] GET /api/goals - Database error:", goalsError)
      throw goalsError
    }

    const { data: assignments, error: assignmentsError } = await supabase.from("GoalAssignments").select(`
        goalId,
        userId,
        assignedTarget,
        user:Users!GoalAssignments_userId_fkey (
          id,
          name,
          email
        )
      `)

    if (assignmentsError) {
      console.log("[v0] GET /api/goals - Assignments error:", assignmentsError)
      throw assignmentsError
    }

    const goalsWithAssignments = goals?.map((goal) => {
      const goalAssignments = assignments?.filter((a) => a.goalId === goal.id) || []
      return {
        ...goal,
        assignedUsers: goalAssignments.map((a) => ({
          id: a.user.id,
          name: a.user.name,
          email: a.user.email,
          assignedTarget: a.assignedTarget,
        })),
      }
    })

    console.log("[v0] GET /api/goals - Fetched goals:", goalsWithAssignments?.length || 0)
    console.log("[v0] GET /api/goals - Sample goal assignedUsers:", goalsWithAssignments?.[0]?.assignedUsers || [])

    return NextResponse.json({ goals: goalsWithAssignments || [] })
  } catch (error) {
    console.error("[v0] GET /api/goals - Error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST /api/goals - Starting")
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      console.log("[v0] POST /api/goals - No token")
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      console.log("[v0] POST /api/goals - Invalid token")
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    console.log("[v0] POST /api/goals - User authenticated:", decoded.id, decoded.role)

    const body = await request.json()
    console.log("[v0] POST /api/goals - Request body:", body)

    const { title, description, target, unit, startDate, endDate, assignments, subMetrics } = body

    if (!title || !target || !startDate || !endDate) {
      console.log("[v0] POST /api/goals - Missing required fields")
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      console.log("[v0] POST /api/goals - No assignments")
      return NextResponse.json({ message: "At least one assignee is required" }, { status: 400 })
    }

    const supabase = await createClient()

    console.log("[v0] POST /api/goals - Creating goal...")
    const { data: goal, error: goalError } = await supabase
      .from("Goals")
      .insert({
        title,
        description,
        target: Number.parseFloat(target),
        unit: unit || "units",
        startDate,
        endDate,
        createdById: decoded.id,
      })
      .select()
      .single()

    if (goalError) {
      console.log("[v0] POST /api/goals - Goal creation error:", goalError)
      throw goalError
    }

    console.log("[v0] POST /api/goals - Goal created:", goal.id)

    const assignmentData = assignments.map((assignment: { userId: number; assignedTarget: number }) => ({
      goalId: goal.id,
      userId: assignment.userId,
      assignedTarget: Number.parseFloat(assignment.assignedTarget.toString()),
    }))

    console.log("[v0] POST /api/goals - Creating assignments:", assignmentData)
    const { error: assignmentError } = await supabase.from("GoalAssignments").insert(assignmentData)

    if (assignmentError) {
      console.log("[v0] POST /api/goals - Assignment error:", assignmentError)
      throw assignmentError
    }

    if (subMetrics && Array.isArray(subMetrics) && subMetrics.length > 0) {
      console.log("[v0] POST /api/goals - Creating sub-metrics:", subMetrics.length)
      const subMetricData = subMetrics.map((sm: { name: string; color: string }, index: number) => ({
        goalId: goal.id,
        name: sm.name,
        color: sm.color,
        displayOrder: index,
      }))

      const { error: subMetricError } = await supabase.from("SubMetrics").insert(subMetricData)

      if (subMetricError) {
        console.log("[v0] POST /api/goals - Sub-metric error:", subMetricError)
        throw subMetricError
      }
    }

    console.log("[v0] POST /api/goals - Success!")
    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error("[v0] POST /api/goals - Error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
