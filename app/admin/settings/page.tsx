"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/app/context/AuthContext"
import type { Setting } from "@/types"

export default function AdminSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    console.log("[v0] Settings page - user:", user, "authLoading:", authLoading)
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      console.log("[v0] Not admin, redirecting to home")
      router.push("/")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === "ADMIN") {
      console.log("[v0] User is admin, fetching settings")
      fetchSettings()
    }
  }, [user])

  async function fetchSettings() {
    console.log("[v0] Fetching settings...")
    try {
      const response = await fetch("/api/admin/settings")
      console.log("[v0] Settings response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Settings data:", data)
        setSettings(data.settings || [])
      } else {
        console.error("[v0] Failed to fetch settings:", response.status)
      }
    } catch (error) {
      console.error("[v0] Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateSetting(key: string, value: string) {
    console.log("[v0] Updating setting:", key, "to:", value)
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      })
      console.log("[v0] Update response status:", response.status)
      if (response.ok) {
        console.log("[v0] Setting updated successfully")
        fetchSettings()
        router.refresh() // Refresh server components to apply global theme immediately
      } else {
        console.error("[v0] Failed to update setting:", response.status)
      }
    } catch (error) {
      console.error("[v0] Error updating setting:", error)
    } finally {
      setSaving(false)
    }
  }

  const isRegistrationOpen = settings.find((s) => s.key === "isRegistrationOpen")?.value === "true"
  const requireApproval = settings.find((s) => s.key === "requireApproval")?.value === "true"
  const showWorkLogTitle = settings.find((s) => s.key === "showWorkLogTitle")?.value === "true"
  const showWorkLogImages = settings.find((s) => s.key === "showWorkLogImages")?.value === "true"
  const showWorkLogDescription = settings.find((s) => s.key === "showWorkLogDescription")?.value === "true"
  const showHiddenCards = settings.find((s) => s.key === "showHiddenCards")?.value === "true"
  const globalTheme = settings.find((s) => s.key === "globalTheme")?.value || "light"

  console.log("[v0] Render - Settings:", settings)
  console.log("[v0] Render - showHiddenCards:", showHiddenCards)
  console.log("[v0] Render - showHiddenCards raw value:", settings.find((s) => s.key === "showHiddenCards")?.value)

  console.log("[v0] Current settings - isRegistrationOpen:", isRegistrationOpen, "requireApproval:", requireApproval)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">

        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">กำลังโหลด...</div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto p-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">ตั้งค่าระบบ</h1>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">เปิดระบบสมัครสมาชิก</h3>
                <p className="text-sm text-muted-foreground">อนุญาตให้ผู้ใช้ใหม่สมัครสมาชิกได้</p>
              </div>
              <Switch
                checked={isRegistrationOpen}
                onCheckedChange={(checked) => {
                  console.log("[v0] Registration toggle clicked, new value:", checked)
                  updateSetting("isRegistrationOpen", checked.toString())
                }}
                disabled={saving}
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">ต้องการการอนุมัติ</h3>
                <p className="text-sm text-muted-foreground">ผู้ใช้ใหม่ต้องได้รับการอนุมัติจากผู้ดูแลก่อนเข้าใช้งาน</p>
              </div>
              <Switch
                checked={requireApproval}
                onCheckedChange={(checked) => {
                  console.log("[v0] Approval toggle clicked, new value:", checked)
                  updateSetting("requireApproval", checked.toString())
                }}
                disabled={saving}
              />
            </div>
          </Card>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">การแสดงผลบันทึกการทำงาน</h2>
            <p className="text-sm text-muted-foreground mb-4">
              ตั้งค่าการแสดงรายละเอียดของบันทึกการทำงานในหน้า KPI
            </p>

            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">แสดงชื่อผู้บันทึก</h3>
                    <p className="text-sm text-muted-foreground">แสดงชื่อผู้บันทึก</p>
                  </div>
                  <Switch
                    checked={showWorkLogTitle}
                    onCheckedChange={(checked) => updateSetting("showWorkLogTitle", checked.toString())}
                    disabled={saving}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">แสดงรูปภาพ</h3>
                    <p className="text-sm text-muted-foreground">แสดงรูปภาพที่แนบมากับบันทึกการทำงาน</p>
                  </div>
                  <Switch
                    checked={showWorkLogImages}
                    onCheckedChange={(checked) => updateSetting("showWorkLogImages", checked.toString())}
                    disabled={saving}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">แสดงรายละเอียด</h3>
                    <p className="text-sm text-muted-foreground">แสดงรายละเอียดของบันทึกการทำงาน</p>
                  </div>
                  <Switch
                    checked={showWorkLogDescription}
                    onCheckedChange={(checked) => updateSetting("showWorkLogDescription", checked.toString())}
                    disabled={saving}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">แสดงการ์ดที่ซ่อน</h3>
                    <p className="text-sm text-muted-foreground">อนุญาตให้ผู้ใช้ที่เข้าสู่ระบบมองเห็นการ์ดที่ถูกซ่อนไว้</p>
                  </div>
                  <Switch
                    checked={showHiddenCards}
                    onCheckedChange={(checked) => updateSetting("showHiddenCards", checked.toString())}
                    disabled={saving}
                  />
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">การแสดงผลทั่วไป</h2>
            <p className="text-sm text-muted-foreground mb-4">
              ตั้งค่าการแสดงผลทั่วไปของระบบ
            </p>

            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">ธีมเริ่มต้นของระบบ</h3>
                    <p className="text-sm text-muted-foreground">กำหนดธีมเริ่มต้นสำหรับผู้ใช้งานทุกคน</p>
                  </div>
                  <Select
                    value={globalTheme}
                    onValueChange={(value) => updateSetting("globalTheme", value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="เลือกธีม" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light (สว่าง)</SelectItem>
                      <SelectItem value="violet">Violet (ม่วง)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>

  )
}
