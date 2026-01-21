import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/db"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

// Helper to delete image from PhotoCloud
async function deleteFromPhotoCloud(url: string) {
  try {
    // Extract ID from URL: https://collections.wu.ac.th/photocloud/image.php?id=123
    const urlObj = new URL(url)
    const id = urlObj.searchParams.get("id")

    if (!id) {
      console.warn("Could not extract ID from PhotoCloud URL:", url)
      return
    }

    const apiKey = process.env.PHOTOCLOUD_API_KEY
    if (!apiKey) {
      console.error("Missing PhotoCloud API Key")
      return
    }

    const formData = new FormData()
    formData.append("id", id)
    formData.append("api_key", apiKey)

    const response = await fetch("https://collections.wu.ac.th/photocloud/api/delete.php", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      console.error("PhotoCloud delete failed:", await response.text())
    } else {
      const result = await response.json()
      console.log("PhotoCloud delete result:", result)
    }
  } catch (error) {
    console.error("Error deleting from PhotoCloud:", error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { completedWork, subMetricId, subMetricValues, description, date, images, goalId } = await request.json()

    if (!date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Validate: either completedWork or subMetricValues must be provided
    if (!completedWork && !subMetricValues) {
      return NextResponse.json({ message: "Missing completedWork or subMetricValues" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user owns this work log or is admin
    const { data: existingLog, error: fetchError } = await supabase
      .from("WorkLogs")
      .select("userId")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    if (existingLog.userId !== decoded.id && decoded.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const updateData: any = {
      description,
      date,
      goalId: goalId ? Number(goalId) : undefined,
    }

    if (subMetricValues) {
      // New format: update subMetricValues JSONB
      updateData.subMetricValues = subMetricValues
      const totalCompletedWork = Object.values(subMetricValues).reduce(
        (sum: number, val: any) => sum + (Number(val) || 0),
        0,
      )
      updateData.completedWork = totalCompletedWork
      updateData.subMetricId = null
    } else {
      // Old format: update completedWork + subMetricId
      updateData.completedWork = Number.parseFloat(completedWork)
      updateData.subMetricId = subMetricId ? Number.parseInt(subMetricId) : null
    }

    // Update work log
    const { data: workLog, error } = await supabase
      .from("WorkLogs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    // Handle Image Updates
    // 1. Get existing images
    const { data: existingImages } = await supabase.from("Images").select("url").eq("workLogId", id)
    const existingUrls = existingImages?.map((img) => img.url) || []
    const newUrls = images || []

    // 2. Identify images to delete (present in existing but not in new)
    const imagesToDelete = existingUrls.filter((url) => !newUrls.includes(url))

    // 3. Delete removed images from PhotoCloud
    for (const url of imagesToDelete) {
      // Only delete if it's a PhotoCloud URL
      if (url.includes("collections.wu.ac.th")) {
        await deleteFromPhotoCloud(url)
      }
    }

    // 4. Update DB: Delete all existing and insert new (simplest approach for DB, but we already handled cloud deletion)
    // Actually, to be safe and efficient, we can delete only removed ones from DB and insert only new ones.
    // But the previous logic was "Delete all, Insert all". Let's stick to that for DB consistency, 
    // BUT we must ensure we don't lose the publicId if we were storing it. 
    // Since we are not strictly using publicId from DB for deletion (we parse URL), it's fine to replace DB records.

    await supabase.from("Images").delete().eq("workLogId", id)

    if (images && images.length > 0) {
      const imageRecords = images.map((url: string) => {
        // Try to extract ID for DB storage if possible, though we parse URL for deletion
        let publicId = null
        try {
          if (url.includes("collections.wu.ac.th")) {
            const urlObj = new URL(url)
            publicId = urlObj.searchParams.get("id")
          }
        } catch (e) { }

        return {
          workLogId: Number.parseInt(id),
          url,
          publicId
        }
      })

      const { error: imageError } = await supabase.from("Images").insert(imageRecords)

      if (imageError) {
        console.error("Error inserting images:", imageError)
      }
    }

    return NextResponse.json({ workLog })
  } catch (error) {
    console.error("Update work log error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Check if user owns this work log or is admin
    const { data: existingLog, error: fetchError } = await supabase
      .from("WorkLogs")
      .select("userId")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    if (existingLog.userId !== decoded.id && decoded.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Get images before deleting
    const { data: images } = await supabase.from("Images").select("url").eq("workLogId", id)

    // Delete images from PhotoCloud
    if (images) {
      for (const img of images) {
        if (img.url && img.url.includes("collections.wu.ac.th")) {
          await deleteFromPhotoCloud(img.url)
        }
      }
    }

    // Delete images from DB
    await supabase.from("Images").delete().eq("workLogId", id)

    // Delete work log
    const { error } = await supabase.from("WorkLogs").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Work log deleted successfully" })
  } catch (error) {
    console.error("Delete work log error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
