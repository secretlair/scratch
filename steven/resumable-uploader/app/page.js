'use client';

import { useState } from 'react';
import UploadForm from './components/UploadForm';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'paused'
  const [uploadId, setUploadId] = useState(null);

  const handleFileChange = (selectedFile) => {
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Initialize upload
      const initResponse = await fetch('/api/upload/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      const { uploadId } = await initResponse.json();
      setUploadId(uploadId);

      // Upload content
      await uploadContent(file, uploadId, file.name, file.size);

      // Complete upload
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, fileName: file.name }),
      });
      console.log('Upload completed: ', completeResponse)

      setUploadStatus('idle');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('idle');
    }
  };

  const uploadContent = async (content, uploadId, fileName, contentSize) => {
    const url = `/api/upload/content?fileName=${encodeURIComponent(fileName)}&uploadId=${uploadId}&contentSize=${contentSize}`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');

      xhr.upload.onprogress = (progressEvent) => {
        if (progressEvent.lengthComputable) {
            // Update the progress bar
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Uploaded content: ', xhr)
          resolve(null);
        } else {
          reject(new Error('Failed to upload part'));
        }
      };

      xhr.onerror = () => reject(new Error('Failed to upload part'));
      xhr.send(content);
    });
  };

  const handlePauseResume = () => {
    // For simplicity, we'll just toggle the status
    // In a real implementation, you'd need to handle pausing and resuming the actual upload
    setUploadStatus(uploadStatus === 'uploading' ? 'paused' : 'uploading');
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Resumable File Uploader</h1>
      </header>
      <main className="flex items-center justify-center p-4 bg-gray-100">
        <div className="w-full max-w-2xl">
          <UploadForm
            file={file}
            uploadProgress={uploadProgress}
            uploadStatus={uploadStatus}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
            onPauseResume={handlePauseResume}
          />
        </div>
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2024 Resumable File Uploader</p>
      </footer>
    </div>
  );
}
