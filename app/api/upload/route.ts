import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API called")
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File received:", file.name, file.type, file.size)

    const apiKey = process.env.PHOTOCLOUD_API_KEY

    if (!apiKey) {
      console.error("[v0] Missing PhotoCloud API Key")
      return NextResponse.json({ error: "Server configuration error: Missing PhotoCloud API Key" }, { status: 500 })
    }

    // Prepare FormData for PhotoCloud
    const photoCloudFormData = new FormData()
    photoCloudFormData.append("image", file)

    console.log("[v0] Uploading to PhotoCloud...")

    const uploadResponse = await fetch("https://collections.wu.ac.th/photocloud/api/upload.php", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
      },
      body: photoCloudFormData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("[v0] PhotoCloud upload failed:", errorText)
      throw new Error(`PhotoCloud upload failed: ${uploadResponse.statusText}`)
    }

    const result = await uploadResponse.json()
    console.log("[v0] Upload successful:", result)

    if (!result.success) {
      console.error("[v0] PhotoCloud returned error:", result.message)
      return NextResponse.json({ error: result.message || "Upload failed" }, { status: 500 })
    }

    return NextResponse.json({
      url: result.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      publicId: result.id, // PhotoCloud returns 'id'
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
