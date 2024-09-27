'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Loader2, Upload, RefreshCw } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileStatus {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
}

export default function FileUpload() {
  const [files, setFiles] = useState<FileStatus[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [canUpload, setCanUpload] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.filter(newFile => 
      !files.some(existingFile => 
        existingFile.file.name === newFile.name && 
        existingFile.file.size === newFile.size &&
        existingFile.status !== 'error'
      )
    )
    setFiles(prevFiles => [
      ...prevFiles,
      ...newFiles.map(file => ({ file, status: 'pending' as const }))
    ])
  }, [files])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  useEffect(() => {
    const hasPendingFiles = files.some(file => file.status === 'pending')
    const hasErrorFiles = files.some(file => file.status === 'error')
    setCanUpload(hasPendingFiles || hasErrorFiles)
  }, [files])

  const uploadFiles = async () => {
    setUploading(true)
    setProgress(0)

    const filesToUpload = files.filter(file => file.status === 'pending' || file.status === 'error')

    for (let i = 0; i < filesToUpload.length; i++) {
      setFiles(prev => prev.map(f => 
        f.file.name === filesToUpload[i].file.name ? { ...f, status: 'uploading' } : f
      ))

      const file = filesToUpload[i].file
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        setFiles(prev => prev.map(f => 
          f.file.name === filesToUpload[i].file.name ? { ...f, status: 'success' } : f
        ))
      } catch (error) {
        console.error('Error uploading file:', error)
        setFiles(prev => prev.map(f => 
          f.file.name === filesToUpload[i].file.name ? { ...f, status: 'error' } : f
        ))
      }

      setProgress((prevProgress) => prevProgress + (100 / filesToUpload.length))
    }

    setUploading(false)
  }

  const getButtonText = () => {
    if (uploading) return "Uploading..."
    if (files.some(file => file.status === 'error')) return "Retry"
    return "Upload Files"
  }

  const getButtonIcon = () => {
    if (uploading) return <Loader2 className="animate-spin mr-2" />
    if (files.some(file => file.status === 'error')) return <RefreshCw className="mr-2" />
    return <Upload className="mr-2" />
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden border-2 border-blue-200">
      <div className="p-6 space-y-4">
        <div 
          {...getRootProps()} 
          className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-blue-500">Drop the files here ...</p>
          ) : (
            <p className="text-blue-500">Drag 'n' drop some files here, or click to select files</p>
          )}
        </div>
        
        <div className="h-40 border-2 border-blue-200 rounded-md">
          {files.length > 0 ? (
            <ScrollArea className="h-full p-2">
              <div className="pr-3">
                <p className="mb-2 text-sm text-blue-600">{files.length} file(s) selected</p>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      {file.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {file.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {file.status === 'pending' && (
                        <div className="h-4 w-4" />
                      )}
                      <span className="truncate flex-1">{file.file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-blue-400">
              No files selected
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={uploadFiles}
            disabled={uploading || !canUpload}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {getButtonIcon()}
            {getButtonText()}
          </button>
          
          <div className="h-6">
            {uploading && (
              <div className="space-y-1">
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-blue-600 text-right">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
