import { NextResponse } from "next/server"
import { createClient } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (isNaN(Number.parseInt(id))) {
      return NextResponse.json({ message: "Invalid goal ID" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: subMetrics, error } = await supabase
      .from("SubMetrics")
      .select("*")
      .eq("goalId", id)
      .order("displayOrder", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching sub-metrics:", error)
      throw error
    }

    return NextResponse.json({ subMetrics: subMetrics || [] })
  } catch (error) {
    console.error("[v0] GET /api/goals/[id]/sub-metrics error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
