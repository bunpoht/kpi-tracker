"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/app/context/AuthContext"
import { Trash2, Key, UserPlus, Shield, UserIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: number
  email: string
  name: string
  role: string
  status: string
  profilePicture?: string
  createdAt: string
}

export default function ManageUsersPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", role: "USER" })
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== "ADMIN")) {
      router.push("/")
    }
  }, [currentUser, authLoading, router])

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetchUsers()
    }
  }, [currentUser])

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddUser() {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })
      if (response.ok) {
        setShowAddDialog(false)
        setNewUser({ email: "", password: "", name: "", role: "USER" })
        fetchUsers()
      } else {
        const data = await response.json()
        alert(data.message || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error adding user:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchUsers()
      } else {
        const data = await response.json()
        alert(data.message || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  async function handleChangePassword() {
    if (!selectedUserId || !newPassword) return

    try {
      const response = await fetch(`/api/users/${selectedUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      if (response.ok) {
        setShowPasswordDialog(false)
        setSelectedUserId(null)
        setNewPassword("")
        alert("เปลี่ยนรหัสผ่านสำเร็จ")
      } else {
        const data = await response.json()
        alert(data.message || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  async function handleRoleChange(userId: number, newRole: string) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (response.ok) {
        fetchUsers()
        alert("เปลี่ยนสิทธิ์ผู้ใช้สำเร็จ")
      } else {
        const data = await response.json()
        alert(data.message || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error changing role:", error)
      alert("เกิดข้อผิดพลาด")
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

  if (!currentUser || currentUser.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">จัดการผู้ใช้งาน</h1>
          <Button onClick={() => setShowAddDialog(true)} size="sm" className="h-8 sm:h-10">
            <UserPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">เพิ่มผู้ใช้</span>
          </Button>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {users.map((user) => (
            <Card key={user.id} className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture || "/placeholder.svg"}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{user.name}</h3>
                      {user.role === "ADMIN" && (
                        <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                      {user.id !== currentUser.id ? (
                        <Select value={user.role} onValueChange={(newRole) => handleRoleChange(user.id, newRole)}>
                          <SelectTrigger className="h-6 w-[90px] text-[10px] sm:text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">USER</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-muted">
                          {user.role}
                        </span>
                      )}
                      <span
                        className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${user.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : user.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end sm:justify-start">
                  <Button
                    onClick={() => {
                      setSelectedUserId(user.id)
                      setShowPasswordDialog(true)
                    }}
                    variant="outline"
                    size="sm"
                    className="h-8 sm:h-9"
                  >
                    <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">เปลี่ยนรหัสผ่าน</span>
                  </Button>
                  {user.id !== currentUser.id && (
                    <Button
                      onClick={() => handleDeleteUser(user.id)}
                      variant="destructive"
                      size="sm"
                      className="h-8 sm:h-9"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">ลบ</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add User Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
              <DialogDescription>กรอกข้อมูลผู้ใช้ใหม่</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">ชื่อ</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="ชื่อผู้ใช้"
                />
              </div>
              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="รหัสผ่าน"
                />
              </div>
              <div>
                <Label htmlFor="role">สิทธิ์</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleAddUser}>เพิ่มผู้ใช้</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
              <DialogDescription>กรอกรหัสผ่านใหม่สำหรับผู้ใช้</DialogDescription>
            </DialogHeader>
            <div>
              <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="รหัสผ่านใหม่"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false)
                  setNewPassword("")
                }}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleChangePassword}>เปลี่ยนรหัสผ่าน</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
