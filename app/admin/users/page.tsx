"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/app/context/AuthContext"
import { Check, X, Clock } from "lucide-react"

interface PendingUser {
  id: number
  email: string
  name: string
  status: string
  createdAt: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchPendingUsers()
    }
  }, [user])

  async function fetchPendingUsers() {
    try {
      const response = await fetch("/api/admin/users/pending")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching pending users:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(userId: number) {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
      })
      if (response.ok) {
        fetchPendingUsers()
      }
    } catch (error) {
      console.error("Error approving user:", error)
    }
  }

  async function handleReject(userId: number) {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: "POST",
      })
      if (response.ok) {
        fetchPendingUsers()
      }
    } catch (error) {
      console.error("Error rejecting user:", error)
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

  if (!user || user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">อนุมัติผู้ใช้งาน</h1>

        {users.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">ไม่มีผู้ใช้งานรอการอนุมัติ</Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        สมัครเมื่อ: {new Date(user.createdAt).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(user.id)}
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      อนุมัติ
                    </Button>
                    <Button onClick={() => handleReject(user.id)} variant="destructive" size="sm">
                      <X className="h-4 w-4 mr-1" />
                      ปฏิเสธ
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
