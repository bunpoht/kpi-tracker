import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

// Next.js 15 changed params to be a Promise so we need to await it
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params

    if (Number.isNaN(Number.parseInt(id))) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    console.log("[v0] GET /api/goals/[id] - startDate:", startDate, "endDate:", endDate)

    const supabase = await createClient()

    // Get goal with assignments and work logs
    const { data: goal, error: goalError } = await supabase.from("Goals").select("*").eq("id", id).single()

    if (goalError) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    const { data: assignments, error: assignmentsError } = await supabase
      .from("GoalAssignments")
      .select(
        `
        *,
        user:Users(id, name, email, profilePicture)
      `,
      )
      .eq("goalId", id)

    if (assignmentsError) throw assignmentsError

    let workLogsQuery = supabase
      .from("WorkLogs")
      .select(
        `
        *,
        user:Users(id, name, email, profilePicture),
        images:Images(*)
      `,
      )
      .eq("goalId", id)

    if (startDate && endDate) {
      console.log("[v0] Filtering work logs between", startDate, "and", endDate)
      workLogsQuery = workLogsQuery.gte("date", startDate).lte("date", endDate)
    }

    const { data: workLogs, error: workLogsError } = await workLogsQuery.order("date", { ascending: false })

    if (workLogsError) throw workLogsError

    console.log("[v0] Found", workLogs?.length || 0, "work logs")

    return NextResponse.json({
      goal,
      assignments: assignments || [],
      workLogs: workLogs || [],
    })
  } catch (error) {
    console.error("Get goal error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params

    if (Number.isNaN(Number.parseInt(id))) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: goal, error: goalError } = await supabase.from("Goals").select("createdById").eq("id", id).single()

    if (goalError || !goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    // Delete goal (CASCADE will handle related records)
    const { error } = await supabase.from("Goals").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Goal deleted successfully" })
  } catch (error) {
    console.error("Delete goal error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params

    if (Number.isNaN(Number.parseInt(id))) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: goal, error: goalError } = await supabase.from("Goals").select("createdById").eq("id", id).single()

    if (goalError || !goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, unit, target, startDate, endDate, assignments, subMetrics } = body

    // Update goal
    const { error: updateError } = await supabase
      .from("Goals")
      .update({
        title,
        description,
        unit,
        target,
        startDate,
        endDate,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) throw updateError

    // Update assignments if provided
    if (assignments && Array.isArray(assignments)) {
      // Delete existing assignments
      await supabase.from("GoalAssignments").delete().eq("goalId", id)

      // Create new assignments
      if (assignments.length > 0) {
        const assignmentRecords = assignments.map((a: any) => ({
          goalId: Number.parseInt(id),
          userId: a.userId,
          assignedTarget: a.assignedTarget,
        }))

        const { error: assignError } = await supabase.from("GoalAssignments").insert(assignmentRecords)
        if (assignError) throw assignError
      }
    }

    if (subMetrics !== undefined) {
      console.log("[v0] PUT /api/goals/[id] - Updating sub-metrics")

      // Delete existing sub-metrics
      await supabase.from("SubMetrics").delete().eq("goalId", id)

      // Create new sub-metrics if any
      if (Array.isArray(subMetrics) && subMetrics.length > 0) {
        const subMetricData = subMetrics
          .filter((sm: any) => sm.name && sm.name.trim())
          .map((sm: any, index: number) => ({
            goalId: Number.parseInt(id),
            name: sm.name,
            color: sm.color,
            displayOrder: index,
          }))

        if (subMetricData.length > 0) {
          const { error: subMetricError } = await supabase.from("SubMetrics").insert(subMetricData)
          if (subMetricError) {
            console.error("[v0] Sub-metric update error:", subMetricError)
            throw subMetricError
          }
        }
      }
    }

    return NextResponse.json({ message: "Goal updated successfully" })
  } catch (error) {
    console.error("Update goal error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params

    if (Number.isNaN(Number.parseInt(id))) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const { isVisible } = body

    console.log("[v0] PATCH /api/goals/[id] - Updating isVisible for goal", id, "to:", isVisible)

    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from("Goals")
      .update({
        isVisible,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      console.error("[v0] Failed to update isVisible:", updateError)
      throw updateError
    }

    console.log("[v0] Successfully updated isVisible for goal", id)

    return NextResponse.json({ message: "Visibility updated successfully", isVisible })
  } catch (error) {
    console.error("Update visibility error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
