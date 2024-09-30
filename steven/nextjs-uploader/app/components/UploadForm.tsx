'use client';

import { useState, useRef, useCallback } from 'react';
import ProgressBar from './ProgressBar';
import PauseButton from './PauseButton';
import ResumeButton from './ResumeButton';
import FileDetails from './FileDetails';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedParts, setUploadedParts] = useState<{ ETag: string; PartNumber: number }[]>([]);
  const [currentPart, setCurrentPart] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const initializeUpload = async () => {
    if (!file) return null;
    try {
      const response = await fetch('/api/upload/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!response.ok) throw new Error('Failed to initialize upload');
      const { uploadId } = await response.json();
      setUploadId(uploadId);
      return uploadId;
    } catch (error) {
      console.error('Error initializing upload:', error);
      return null;
    }
  };

  const uploadContent = async (content: Blob, uploadId: string) => {
    const url = `/api/upload/content?fileName=${encodeURIComponent(file!.name)}&uploadId=${uploadId}`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');

      xhr.upload.onprogress = (progressEvent) => {
        if (progressEvent.lengthComputable) {
            // Update the progress bar
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(null);
        } else {
          reject(new Error('Failed to upload part'));
        }
      };

      xhr.onerror = () => reject(new Error('Failed to upload part'));
      xhr.send(content);
    });
  };

  const getUploadProgress = useCallback(async (fileName: string, uploadId: string) => {
    try {
      const response = await fetch(`/api/upload/progress?fileName=${encodeURIComponent(fileName)}&uploadId=${uploadId}`);
      if (!response.ok) throw new Error('Failed to get upload progress');
      const { parts } = await response.json();
      return parts;
    } catch (error) {
      console.error('Error getting upload progress:', error);
      return [];
    }
  }, []);

  const completeUpload = async (uploadId: string, parts: { ETag: string; PartNumber: number }[]) => {
    try {
      const response = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file!.name, uploadId, parts }),
      });
      if (!response.ok) throw new Error('Failed to complete upload');
      const result = await response.json();
      console.log('Upload completed:', result);
    } catch (error) {
      console.error('Error completing upload:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!file) return;  

    // Initialize the upload
    const newUploadId = await initializeUpload();
    if (!newUploadId) {
        console.error('Failed to initialize upload');
        return;
    }

    setProgress(0);

    try {
        abortControllerRef.current = new AbortController();
        const respoonse = await uploadContent(file, newUploadId);
    } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
            console.log('Upload paused');
            return;
        }
            console.error('Error uploading part:', error);
            return;
    }

    try {
      await completeUpload(newUploadId, uploadedParts);
      console.log('Upload completed successfully');
      // Reset state or show success message
    } catch (error) {
      console.error('Error completing upload:', error);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    handleUpload(); // This will resume from where it left off
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mb-4 ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        {file ? (
          <FileDetails file={file} />
        ) : (
          <p className="text-gray-500">
            Drag and drop a file here, or click to select a file
          </p>
        )}
      </div>
      {file && (
        <>
          <button
            onClick={handleUpload}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4 transition duration-300"
            disabled={isPaused}
          >
            {uploadId ? 'Resume Upload' : 'Start Upload'}
          </button>
          <ProgressBar progress={progress} />
          <div className="flex justify-between mt-4">
            <PauseButton onClick={handlePause} disabled={!uploadId || isPaused} />
            <ResumeButton onClick={handleResume} disabled={!uploadId || !isPaused} />
          </div>
        </>
      )}
    </div>
  );
}