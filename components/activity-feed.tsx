"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditWorkLogDialog } from "@/components/edit-worklog-dialog"
import type { WorkLogWithDetails } from "@/types"
import { formatThaiDate } from "@/lib/utils"
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from "@/app/context/AuthContext"

interface ActivityFeedProps {
  workLogs: WorkLogWithDetails[]
  onUpdate: () => void
}

export function ActivityFeed({ workLogs, onUpdate }: ActivityFeedProps) {
  const { user } = useAuth()
  const [editingLog, setEditingLog] = useState<WorkLogWithDetails | null>(null)
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [viewFilter, setViewFilter] = useState<"own" | "all">("own")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  async function handleDelete(id: number) {
    setDeleting(true)
    try {
      const response = await fetch(`/api/worklogs/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("ไม่สามารถลบบันทึกได้")
      }

      setDeletingLogId(null)
      onUpdate()
    } catch (error) {
      console.error("Delete error:", error)
      alert("เกิดข้อผิดพลาดในการลบบันทึก")
    } finally {
      setDeleting(false)
    }
  }

  function canEditDelete(log: WorkLogWithDetails) {
    return user && (user.id === log.userId || user.role?.toLowerCase() === "admin")
  }

  const filteredWorkLogs = useMemo(() => {
    let filtered = workLogs

    // Apply view filter (own vs all)
    if (viewFilter === "own" && user) {
      filtered = filtered.filter((log) => log.userId === user.id)
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.goal?.title?.toLowerCase().includes(query) ||
          log.user?.name?.toLowerCase().includes(query) ||
          log.description?.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [workLogs, viewFilter, searchQuery, user])

  const totalPages = Math.ceil(filteredWorkLogs.length / itemsPerPage)
  const paginatedWorkLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredWorkLogs.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredWorkLogs, currentPage, itemsPerPage])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (value: "own" | "all") => {
    setViewFilter(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเป้าหมาย, ชื่อผู้ใช้, หรือรายละเอียด..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 font-prompt bg-background border-input focus:ring-primary/20 h-10"
          />
        </div>
        {user?.role === "ADMIN" && (
          <Select value={viewFilter} onValueChange={(value: "own" | "all") => handleFilterChange(value)}>
            <SelectTrigger className="w-full sm:w-[180px] font-prompt bg-background border-input h-10">
              <SelectValue placeholder="เลือกการแสดงผล" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="own" className="font-prompt">งานของฉัน</SelectItem>
              <SelectItem value="all" className="font-prompt">งานทั้งหมด</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {paginatedWorkLogs.length === 0 ? (
          <div className="text-center py-12 bg-secondary/5 rounded-xl border border-dashed border-border/60">
            <p className="text-muted-foreground font-prompt">ไม่พบข้อมูลการบันทึกงาน</p>
          </div>
        ) : (
          <div className="relative pl-4 border-l-2 border-border/40 space-y-8 py-2">
            {paginatedWorkLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm group-hover:scale-125 transition-transform duration-200"></div>

                <div className="bg-card rounded-lg border border-border/40 shadow-sm p-4 hover:shadow-md transition-all duration-200 group-hover:border-primary/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-prompt">
                          {formatThaiDate(log.date)}
                        </span>
                        {log.user && (
                          <span className="text-xs text-muted-foreground font-prompt flex items-center gap-1">
                            โดย <span className="font-medium text-foreground">{log.user.name}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-medium text-base font-prompt text-foreground leading-tight">
                        {log.goal?.title}
                      </h3>

                      <div className="text-sm text-muted-foreground font-prompt font-light mt-2 bg-secondary/10 p-2 rounded-md border border-border/30">
                        <span className="font-medium text-foreground">ผลงาน: </span>
                        {log.subMetricValues ? (
                          <span>
                            {Object.entries(log.subMetricValues).map(([subMetricId, value], index, array) => (
                              <span key={subMetricId}>
                                <span className="font-semibold text-primary">{value}</span> หน่วย
                                {index < array.length - 1 && " และ "}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span>
                            <span className="font-semibold text-primary">{log.completedWork}</span> หน่วย
                          </span>
                        )}
                      </div>

                      {log.description && (
                        <p className="text-sm text-muted-foreground font-prompt mt-2 line-clamp-2">
                          {log.description}
                        </p>
                      )}

                      {log.images && log.images.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                          {log.images.map((image, index) => (
                            <a
                              key={index}
                              href={image.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative w-16 h-16 rounded-md overflow-hidden border border-border hover:opacity-90 transition-opacity flex-shrink-0"
                            >
                              <img src={image.url || "/placeholder.svg"} alt={`Work log image ${index + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {canEditDelete(log) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingLog(log)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingLogId(log.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-prompt text-muted-foreground">
            หน้า {currentPage} จาก {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {editingLog && (
        <EditWorkLogDialog
          workLog={editingLog}
          open={!!editingLog}
          onOpenChange={(open) => !open && setEditingLog(null)}
          onSuccess={onUpdate}
        />
      )}

      <AlertDialog open={!!deletingLogId} onOpenChange={(open) => !open && setDeletingLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-prompt">ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription className="font-prompt">
              คุณแน่ใจหรือไม่ที่จะลบบันทึกงานนี้? การกระทำนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="font-prompt">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingLogId && handleDelete(deletingLogId)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-prompt"
            >
              {deleting ? "กำลังลบ..." : "ลบข้อมูล"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
