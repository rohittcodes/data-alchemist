"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Upload, File, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileSelect?: (file: File | null) => void
  acceptedTypes?: string
  maxSize?: number // in MB
  className?: string
  title?: string
  description?: string
}

export function FileUpload({
  onFileSelect,
  acceptedTypes = "*",
  maxSize = 10,
  className,
  title = "Upload File",
  description = "Drag and drop your file here, or click to browse"
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }
    return null
  }

  const handleFile = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSelectedFile(file)
    onFileSelect?.(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setError(null)
    onFileSelect?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5 scale-105"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20",
          error && "border-destructive bg-destructive/5",
          selectedFile && "border-green-500 bg-green-50 dark:bg-green-950/20"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes}
          onChange={handleFileSelect}
        />

        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-green-700 dark:text-green-400">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile()
                }}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={cn(
              "mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              isDragOver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-medium mb-1">{title}</p>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Max file size: {maxSize}MB
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}