import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const goalId = searchParams.get("goalId")

    if (!month || !year) {
      return NextResponse.json({ message: "Missing month or year" }, { status: 400 })
    }

    const supabase = await createClient()

    let query = supabase
      .from("MonthlyImages")
      .select(`
        *,
        user:Users(id, name, email, profilePicture)
      `)
      .eq("month", parseInt(month))
      .eq("year", parseInt(year))

    if (goalId) {
      query = query.eq("goalId", parseInt(goalId))
    }

    const { data: images, error } = await query.order("createdAt", { ascending: false })

    if (error) {
      console.error("Error fetching monthly images:", error)
      throw error
    }

    return NextResponse.json({ images: images || [] })
  } catch (error) {
    console.error("Get monthly images error:", error)
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

    const { images, month, year, caption, goalId } = await request.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ message: "No images provided" }, { status: 400 })
    }

    if (!month || !year) {
      return NextResponse.json({ message: "Missing month or year" }, { status: 400 })
    }

    const supabase = await createClient()

    const imageRecords = images.map((url: string) => {
      let publicId = null
      try {
        if (url.includes("collections.wu.ac.th")) {
          const urlObj = new URL(url)
          publicId = urlObj.searchParams.get("id")
        }
      } catch (e) { }

      return {
        userId: decoded.id,
        url,
        publicId,
        month: parseInt(month),
        year: parseInt(year),
        caption: caption || null,
        goalId: goalId ? parseInt(goalId) : null,
      }
    })

    const { data, error } = await supabase
      .from("MonthlyImages")
      .insert(imageRecords)
      .select(`
        *,
        user:Users(id, name, email, profilePicture)
      `)

    if (error) {
      console.error("Error inserting monthly images:", error)
      throw error
    }

    return NextResponse.json({ images: data }, { status: 201 })
  } catch (error) {
    console.error("Create monthly images error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ message: "Missing image id" }, { status: 400 })
    }

    const supabase = await createClient()

    // ตรวจสอบว่าเป็นเจ้าของรูปหรือ Admin
    const { data: image, error: fetchError } = await supabase
      .from("MonthlyImages")
      .select("userId")
      .eq("id", id)
      .single()

    if (fetchError || !image) {
      return NextResponse.json({ message: "Image not found" }, { status: 404 })
    }

    if (image.userId !== decoded.id && decoded.role !== "ADMIN") {
      return NextResponse.json({ message: "Permission denied" }, { status: 403 })
    }

    const { error } = await supabase
      .from("MonthlyImages")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting monthly image:", error)
      throw error
    }

    return NextResponse.json({ message: "Image deleted" })
  } catch (error) {
    console.error("Delete monthly image error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
