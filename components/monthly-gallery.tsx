"use client"

import type React from "react"
import { useState, useCallback, useEffect, useId } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ImagePlus, X, Trash2, Upload, ChevronLeft, ChevronRight, ZoomIn, Maximize2, User as UserIcon, Calendar } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import type { MonthlyImage } from "@/types"

interface MonthlyGalleryProps {
  month: number
  year: number
  monthName: string
  fullYear: number
}

export function MonthlyGallery({ month, year, monthName, fullYear }: MonthlyGalleryProps) {
  const { user } = useAuth()
  const [images, setImages] = useState<MonthlyImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [caption, setCaption] = useState("")
  const [pendingFiles, setPendingFiles] = useState<string[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const inputId = useId()

  useEffect(() => {
    fetchImages()
  }, [month, year])

  async function fetchImages() {
    try {
      setLoading(true)
      const response = await fetch(`/api/monthly-images?month=${month}&year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error("Failed to fetch monthly images:", error)
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })
    if (!response.ok) throw new Error("Upload failed")
    const data = await response.json()
    return data.url
  }

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const fileArray = Array.from(files).slice(0, 10)
      const urls = await Promise.all(fileArray.map(f => uploadFile(f)))
      setPendingFiles(prev => [...prev, ...urls])
    } catch (error) {
      console.error("Upload error:", error)
      alert("อัพโหลดรูปภาพไม่สำเร็จ กรุณาลองอีกครั้ง")
    } finally {
      setUploading(false)
    }
  }, [])

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (pendingFiles.length === 0) return
    try {
      setUploading(true)
      const response = await fetch("/api/monthly-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: pendingFiles,
          month,
          year,
          caption: caption || null,
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      setPendingFiles([])
      setCaption("")
      setDialogOpen(false)
      fetchImages()
    } catch (error) {
      console.error("Save error:", error)
      alert("บันทึกรูปภาพไม่สำเร็จ")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(imageId: number) {
    if (!confirm("ต้องการลบรูปภาพนี้ใช่ไหม?")) return
    try {
      const response = await fetch("/api/monthly-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: imageId }),
      })
      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId))
        // ปิด lightbox ถ้ากำลังดูรูปที่ลบ
        if (lightboxOpen && images[lightboxIndex]?.id === imageId) {
          setLightboxOpen(false)
        }
      }
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const navigateLightbox = (direction: number) => {
    setLightboxIndex(prev => {
      const newIndex = prev + direction
      if (newIndex < 0) return images.length - 1
      if (newIndex >= images.length) return 0
      return newIndex
    })
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
      if (e.key === "ArrowLeft") navigateLightbox(-1)
      if (e.key === "ArrowRight") navigateLightbox(1)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen, images.length])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10">
            <ImagePlus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold font-prompt text-foreground">
              ภาพกิจกรรมประจำเดือน
            </h2>
            <p className="text-sm text-muted-foreground font-prompt">
              {monthName} {fullYear}
            </p>
          </div>
        </div>

        {user && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setPendingFiles([])
              setCaption("")
            }
          }}>
            <DialogTrigger asChild>
              <Button className="font-prompt rounded-xl shadow-sm gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                <ImagePlus className="w-4 h-4" />
                เพิ่มรูปภาพ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-prompt text-foreground">เพิ่มรูปภาพประจำเดือน</DialogTitle>
                <DialogDescription className="font-prompt font-light text-muted-foreground">
                  อัพโหลดรูปภาพกิจกรรมประจำเดือน{monthName} {fullYear}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Drop Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                    dragActive
                      ? "border-violet-500 bg-violet-500/10 scale-[1.02]"
                      : "border-border hover:border-violet-400 hover:bg-muted/30"
                  } cursor-pointer`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById(inputId)?.click()}
                >
                  <input
                    id={inputId}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-500/10">
                      <Upload className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    {uploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <p className="font-prompt text-sm text-muted-foreground">กำลังอัพโหลด...</p>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-foreground font-prompt">คลิกหรือลากไฟล์มาวาง</p>
                        <p className="text-xs text-muted-foreground font-prompt">
                          PNG, JPG, GIF สูงสุด 10MB ต่อรูป
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Pending Images Preview */}
                {pendingFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="font-prompt text-foreground text-sm">
                      รูปภาพที่เลือก ({pendingFiles.length} รูป)
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {pendingFiles.map((url, index) => (
                        <div
                          key={index}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted shadow-sm"
                        >
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-1.5 top-1.5 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 rounded-full shadow-md"
                            onClick={(e) => {
                              e.stopPropagation()
                              removePendingFile(index)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Caption */}
                <div className="space-y-2">
                  <Label htmlFor="caption" className="font-prompt text-foreground text-sm">
                    คำอธิบาย (ไม่บังคับ)
                  </Label>
                  <Input
                    id="caption"
                    placeholder="เพิ่มคำอธิบายรูปภาพ..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="font-prompt rounded-lg"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="font-prompt rounded-lg"
                    onClick={() => setDialogOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    className="font-prompt rounded-lg bg-violet-600 hover:bg-violet-700 text-white gap-2"
                    onClick={handleSave}
                    disabled={pendingFiles.length === 0 || uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-4 h-4" />
                        บันทึก ({pendingFiles.length} รูป)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-prompt">กำลังโหลดรูปภาพ...</p>
          </div>
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card/50 backdrop-blur-sm rounded-2xl border border-dashed border-border/40">
          <div className="w-16 h-16 rounded-full bg-violet-500/5 flex items-center justify-center mb-4">
            <ImagePlus className="w-8 h-8 text-violet-500/30" />
          </div>
          <p className="text-muted-foreground font-prompt text-sm">
            ยังไม่มีรูปภาพประจำเดือนนี้
          </p>
          {user && (
            <p className="text-muted-foreground/60 font-prompt text-xs mt-1">
              กดปุ่ม "เพิ่มรูปภาพ" เพื่อเริ่มอัพโหลด
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.url}
                alt={image.caption || `ภาพที่ ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

              {/* Zoom icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <ZoomIn className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {image.caption && (
                  <p className="text-white text-xs font-prompt truncate mb-1">{image.caption}</p>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                    <UserIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-white/80 text-[10px] font-prompt">{image.user?.name}</span>
                </div>
              </div>

              {/* Delete button */}
              {(user?.id === image.userId || user?.role === "ADMIN") && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(image.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Navigation - Previous */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-10 h-12 w-12 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                navigateLightbox(-1)
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].caption || ""}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Image info bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-prompt font-medium">
                      {images[lightboxIndex].user?.name}
                    </p>
                    {images[lightboxIndex].caption && (
                      <p className="text-white/70 text-xs font-prompt">
                        {images[lightboxIndex].caption}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-white/50 text-xs font-prompt">
                  {lightboxIndex + 1} / {images.length}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation - Next */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-10 h-12 w-12 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                navigateLightbox(1)
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
