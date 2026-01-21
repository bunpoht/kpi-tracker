"use client"

import type React from "react"

import { useState, useCallback, useId } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputId = useId()

  const uploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to upload image")
    }

    const data = await response.json()
    return data.url
  }

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      if (images.length >= maxImages) {
        alert(`Maximum ${maxImages} images allowed`)
        return
      }

      setUploading(true)
      try {
        const fileArray = Array.from(files)
        const remainingSlots = maxImages - images.length
        const filesToUpload = fileArray.slice(0, remainingSlots)

        const uploadPromises = filesToUpload.map((file) => uploadImage(file))
        const urls = await Promise.all(uploadPromises)

        onImagesChange([...images, ...urls])
      } catch (error) {
        console.error("Error uploading images:", error)
        alert("Failed to upload images")
      } finally {
        setUploading(false)
      }
    },
    [images, maxImages, onImagesChange],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index)
      onImagesChange(newImages)
    },
    [images, onImagesChange],
  )

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (images.length < maxImages) {
        document.getElementById(inputId)?.click()
      }
    },
    [images.length, maxImages, inputId],
  )

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${dragActive ? "border-primary bg-primary/10" : "border-border"
          } ${images.length >= maxImages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} bg-muted/30 hover:bg-muted/50`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleContainerClick}
      >
        <input
          id={inputId}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading || images.length >= maxImages}
        />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {uploading ? (
              <p>Uploading...</p>
            ) : (
              <>
                <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB ({images.length}/{maxImages} images)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((url, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              <img src={url || "/placeholder.svg"} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(index)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
