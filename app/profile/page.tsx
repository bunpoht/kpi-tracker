"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/app/context/AuthContext"
import { UserIcon, Camera, Save, Trash2 } from "lucide-react"

interface UserProfile {
  id: number
  email: string
  name: string
  role: string
  profilePicture?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login")
    }
  }, [currentUser, authLoading, router])

  useEffect(() => {
    if (currentUser) {
      fetchProfile()
    }
  }, [currentUser])

  async function fetchProfile() {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setName(data.user.name)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Upload response data:", data)

        if (!data.url) {
          console.error("Upload successful but no URL returned")
          alert("อัปโหลดสำเร็จแต่ไม่ได้รับ URL ของรูปภาพ")
          return
        }

        // Update profile with new image URL
        const updateResponse = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePicture: data.url }),
        })

        if (updateResponse.ok) {
          fetchProfile()
        } else {
          const errorData = await updateResponse.json()
          console.error("Failed to update profile picture:", errorData)
          alert("เกิดข้อผิดพลาดในการบันทึกรูปโปรไฟล์: " + (errorData.message || "Unknown error"))
        }
      } else {
        const errorData = await response.json()
        console.error("Upload failed:", errorData)
        alert("การอัปโหลดล้มเหลว: " + (errorData.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ")
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteImage() {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรูปโปรไฟล์?")) {
      return
    }

    setUploading(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePicture: null }),
      })

      if (response.ok) {
        fetchProfile()
      } else {
        const data = await response.json()
        alert(data.message || "เกิดข้อผิดพลาดในการลบรูปภาพ")
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      alert("เกิดข้อผิดพลาดในการลบรูปภาพ")
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (password && password !== confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน")
      return
    }

    setSaving(true)
    try {
      const updates: any = {}
      if (name !== profile?.name) updates.name = name
      if (password) updates.password = password

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        alert("บันทึกข้อมูลสำเร็จ")
        setPassword("")
        setConfirmPassword("")
        fetchProfile()
      } else {
        const data = await response.json()
        alert(data.message || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("เกิดข้อผิดพลาด")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">

        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">กำลังโหลด...</div>
        </div>
      </div>
    )
  }

  if (!currentUser || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto p-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">โปรไฟล์ของฉัน</h1>

        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลส่วนตัว</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                  {profile.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>

                <div className="absolute bottom-0 right-0 flex gap-2">
                  <label
                    htmlFor="profile-picture"
                    className="p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 shadow-sm transition-transform hover:scale-105"
                    title="อัปโหลดรูปภาพ"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>

                  {profile.profilePicture && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-sm transition-transform hover:scale-105"
                      onClick={handleDeleteImage}
                      disabled={uploading}
                      title="ลบรูปภาพ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {uploading && <p className="text-sm text-muted-foreground animate-pulse">กำลังอัปโหลด...</p>}
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">ชื่อ</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อของคุณ" />
            </div>

            {/* Email (read-only) */}
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">ไม่สามารถเปลี่ยนอีเมลได้</p>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่านใหม่"
              />
            </div>

            {/* Confirm Password */}
            {password && (
              <div>
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                />
              </div>
            )}

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
