'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle2, Pause, Play, RotateCcw, X, Upload, Folder, ChevronRight, ChevronDown } from 'lucide-react'

export function EmbeddableFileUploaderJsx() {
  const [items, setItems] = useState([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const uploadIntervalRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleFileChange = async (event) => {
    const newItems = []
    for (const item of event.target.files) {
      if (item.webkitRelativePath) {
        // This is a file within a selected folder
        const pathParts = item.webkitRelativePath.split('/')
        let currentLevel = newItems
        for (let i = 0; i < pathParts.length - 1; i++) {
          let folder = currentLevel.find(f => f.name === pathParts[i] && f.type === 'folder')
          if (!folder) {
            folder = createFolder(pathParts[i])
            currentLevel.push(folder)
          }
          currentLevel = folder.files
        }
        currentLevel.push(fileToFileWithStatus(item))
      } else {
        // This is a directly selected file
        newItems.push(fileToFileWithStatus(item))
      }
    }
    addItems(newItems)
  }

  const createFolder = (name) => ({
    id: Math.random().toString(36).substr(2, 9),
    name: name,
    size: 0,
    type: 'folder',
    files: [],
    progress: 0,
    status: 'queued',
    expanded: false
  })

  const fileToFileWithStatus = (file) => ({
    id: Math.random().toString(36).substr(2, 9),
    name: file.name,
    size: file.size,
    type: 'file',
    progress: 0,
    status: 'queued'
  })

  const addItems = (newItems) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems]
      newItems.forEach(newItem => {
        const existingItemIndex = updatedItems.findIndex(item => item.name === newItem.name && item.type === newItem.type)
        if (existingItemIndex !== -1) {
          if (newItem.type === 'folder') {
            updatedItems[existingItemIndex].files = [
              ...updatedItems[existingItemIndex].files,
              ...newItem.files
            ]
          } else {
            updatedItems[existingItemIndex] = newItem
          }
        } else {
          updatedItems.push(newItem)
        }
      })
      return updatedItems
    })
    startUpload()
  }

  const simulateFileUpload = useCallback(() => {
    setItems(prevItems => {
      const updateItemProgress = (item) => {
        if (item.type === 'folder') {
          const updatedFiles = item.files.map(updateItemProgress)
          const totalProgress = updatedFiles.reduce((sum, file) => sum + file.progress, 0)
          const folderProgress = updatedFiles.length > 0 ? totalProgress / updatedFiles.length : 0
          return {
            ...item,
            files: updatedFiles,
            progress: folderProgress,
            status: folderProgress === 100 ? 'completed' : 'uploading'
          }
        } else if (item.status === 'uploading' && item.progress < 100) {
          const increment = Math.random() * 10
          const newProgress = Math.min(item.progress + increment, 100)
          return {
            ...item,
            progress: newProgress,
            status: newProgress === 100 ? 'completed' : 'uploading'
          }
        }
        return item
      }

      const updatedItems = prevItems.map(updateItemProgress)

      const calculateTotalProgress = (items) => {
        let total = 0
        let count = 0
        items.forEach(item => {
          if (item.type === 'folder') {
            const [subTotal, subCount] = calculateTotalProgress(item.files)
            total += subTotal
            count += subCount
          } else {
            total += item.progress
            count++
          }
        })
        return [total, count]
      }

      const [totalProgress, totalCount] = calculateTotalProgress(updatedItems)
      const newOverallProgress = totalCount > 0 ? (totalProgress / (totalCount * 100) * 100) : 0
      setOverallProgress(newOverallProgress)

      if (newOverallProgress === 100) {
        setIsUploading(false)
        if (uploadIntervalRef.current) {
          clearInterval(uploadIntervalRef.current)
        }
      }

      return updatedItems
    })
  }, [])

  const startUpload = () => {
    if (!isUploading) {
      setIsUploading(true)
      setItems(prevItems => updateItemsStatus(prevItems, 'queued', 'uploading'))
      uploadIntervalRef.current = setInterval(simulateFileUpload, 500)
    }
  }

  const pauseUpload = () => {
    setIsUploading(false)
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current)
    }
    setItems(prevItems => updateItemsStatus(prevItems, 'uploading', 'paused'))
  }

  const resumeUpload = () => {
    startUpload()
  }

  const updateItemsStatus = (items, fromStatus, toStatus) => {
    return items.map(item => {
      if (item.type === 'folder') {
        return {
          ...item,
          files: updateItemsStatus(item.files, fromStatus, toStatus)
        };
      } else if (item.status === fromStatus) {
        return { ...item, status: toStatus }
      }
      return item
    });
  }

  const retryItem = (id) => {
    setItems(prevItems => {
      const updateItem = (items) => {
        return items.map(item => {
          if (item.id === id) {
            return { ...item, status: 'queued', progress: 0 }
          }
          if (item.type === 'folder') {
            return { ...item, files: updateItem(item.files) };
          }
          return item
        });
      }
      return updateItem(prevItems);
    })
    startUpload()
  }

  const removeItem = (id) => {
    setItems(prevItems => {
      const removeItemById = (items) => {
        return items.filter(item => {
          if (item.id === id) {
            return false
          }
          if (item.type === 'folder') {
            item.files = removeItemById(item.files)
            return item.files.length > 0
          }
          return true
        });
      }
      return removeItemById(prevItems);
    })
  }

  const toggleFolder = (id) => {
    setItems(prevItems => {
      const toggleFolderById = (items) => {
        return items.map(item => {
          if (item.id === id && item.type === 'folder') {
            return { ...item, expanded: !item.expanded }
          }
          if (item.type === 'folder') {
            return { ...item, files: toggleFolderById(item.files) };
          }
          return item
        });
      }
      return toggleFolderById(prevItems);
    })
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const items = Array.from(e.dataTransfer.items)
    const newItems = []

    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          if (entry.isFile) {
            const file = item.getAsFile()
            newItems.push(fileToFileWithStatus(file))
          } else if (entry.isDirectory) {
            const folderItem = await processDirectory(entry)
            newItems.push(folderItem)
          }
        }
      }
    }

    addItems(newItems)
  }

  const processDirectory = async (dirEntry) => {
    const files = []
    const dirReader = dirEntry.createReader()

    const readEntries = () => {
      return new Promise((resolve, reject) => {
        dirReader.readEntries(resolve, reject)
      });
    }

    let entries
    do {
      entries = await readEntries()
      for (const entry of entries) {
        if (entry.isFile) {
          const file = await new Promise((resolve) => {
            entry.file(resolve)
          })
          files.push(fileToFileWithStatus(file))
        } else if (entry.isDirectory) {
          const subFolder = await processDirectory(entry)
          files.push(subFolder)
        }
      }
    } while (entries.length > 0)

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: dirEntry.name,
      size: files.reduce((sum, file) => sum + file.size, 0),
      type: 'folder',
      files: files,
      progress: 0,
      status: 'queued',
      expanded: false
    };
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault()
        addItems(Array.from(e.clipboardData.files).map(fileToFileWithStatus))
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste);
  }, [])

  const renderItem = (item, depth = 0) => (
    <div key={item.id} className={`mb-4 last:mb-0 ${depth > 0 ? 'ml-4' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium truncate flex-grow mr-2 flex items-center">
          {item.type === 'folder' && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6 mr-1"
              onClick={() => toggleFolder(item.id)}>
              {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          {item.type === 'folder' ? <Folder className="mr-2 h-4 w-4" /> : null}
          {item.name}
        </span>
        <span className="text-sm text-gray-500 mr-2">
          {(item.size / 1024 / 1024).toFixed(2)} MB
        </span>
        {item.status === 'error' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => retryItem(item.id)}
            className="mr-2">
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Progress value={item.progress} className="flex-grow" />
        {item.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
      </div>
      {item.type === 'folder' && item.expanded && item.files && (
        <div className="mt-2">
          {item.files.map(subItem => renderItem(subItem, depth + 1))}
        </div>
      )}
    </div>
  )

  const totalSize = items.reduce((sum, item) => sum + item.size, 0)

  return (
    (<div className="flex flex-col h-full">
      <div
        className={`flex-grow flex flex-col p-4 space-y-4 border-2 rounded-lg ${
          isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">File Uploader</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={openFileDialog}>
              <Upload className="mr-2 h-4 w-4" />
              Choose Files or Folder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={isUploading ? pauseUpload : resumeUpload}>
              {isUploading ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isUploading ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          webkitdirectory=""
          directory=""
          className="hidden" />
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-medium">{overallProgress.toFixed(2)}%</span>
          </div>
          <Progress value={overallProgress} indicatorColor="bg-green-600" />
        </div>
        <div className="text-sm text-gray-500">
          {items.length} item(s) • {(totalSize / 1024 / 1024).toFixed(2)} MB total
        </div>
        <ScrollArea className="flex-grow border rounded-md">
          <div className="p-4">
            {items.map(item => renderItem(item))}
          </div>
        </ScrollArea>
      </div>
    </div>)
  );
}