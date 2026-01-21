import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/worklogs called")

    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      console.log("[v0] No token")
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      console.log("[v0] Invalid token")
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    console.log("[v0] Fetching worklogs for user:", decoded.id)

    const supabase = await createClient()

    const { data: workLogs, error } = await supabase
      .from("WorkLogs")
      .select(
        `
        *,
        goal:Goals(
          *,
          assignedUsers:GoalAssignments(
            id,
            userId,
            assignedTarget,
            user:Users(id, name, email)
          )
        ),
        user:Users(id, name, email),
        images:Images(*)
      `,
      )
      .order("createdAt", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Error fetching worklogs:", error)
      throw error
    }

    const transformedWorkLogs = workLogs?.map((log) => ({
      ...log,
      goal: log.goal
        ? {
          ...log.goal,
          assignedUsers: log.goal.assignedUsers?.map((a: any) => ({
            id: a.user.id,
            name: a.user.name,
            email: a.user.email,
            assignedTarget: a.assignedTarget,
          })),
        }
        : null,
    }))

    console.log("[v0] Fetched worklogs:", transformedWorkLogs?.length || 0)
    return NextResponse.json({ workLogs: transformedWorkLogs })
  } catch (error) {
    console.error("[v0] Get work logs error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { goalId, subMetricId, completedWork, subMetricValues, description, date, images } = await request.json()

    if (!goalId || !date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (!completedWork && !subMetricValues) {
      return NextResponse.json({ message: "Missing completedWork or subMetricValues" }, { status: 400 })
    }

    const supabase = await createClient()

    const insertData: any = {
      goalId: Number.parseInt(goalId),
      userId: decoded.id,
      description,
      date,
    }

    if (subMetricValues) {
      insertData.subMetricValues = subMetricValues
      const totalCompletedWork = Object.values(subMetricValues).reduce(
        (sum: number, val: any) => sum + (Number(val) || 0),
        0,
      )
      insertData.completedWork = totalCompletedWork
    } else {
      insertData.completedWork = Number.parseFloat(completedWork)
      insertData.subMetricId = subMetricId ? Number.parseInt(subMetricId) : null
    }

    const { data: workLog, error } = await supabase
      .from("WorkLogs")
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    if (images && images.length > 0) {
      const imageRecords = images.map((url: string) => {
        let publicId = null
        try {
          if (url.includes("collections.wu.ac.th")) {
            const urlObj = new URL(url)
            publicId = urlObj.searchParams.get("id")
          }
        } catch (e) { }

        return {
          workLogId: workLog.id,
          url,
          publicId,
        }
      })

      const { error: imageError } = await supabase.from("Images").insert(imageRecords)

      if (imageError) {
        console.error("Error inserting images:", imageError)
      }
    }

    return NextResponse.json({ workLog }, { status: 201 })
  } catch (error) {
    console.error("Create work log error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
