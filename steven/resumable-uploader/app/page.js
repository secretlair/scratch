'use client';

import { useState, useEffect } from 'react';
import UploadForm from './components/UploadForm';
import LeapfilePage from './components/LeapfileHome';

// Custom error class for aborted uploads
class UploadAbortedError extends Error {
  constructor(message = 'Upload aborted') {
    super(message);
    this.name = 'UploadAbortedError';
  }
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'paused', 'completed'
  const [uploadId, setUploadId] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [userName, setUserName] = useState(null)

  const handleFileChange = (selectedFile) => {
    setFile(selectedFile);
  };

  const handleStartUpload = async () => {
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
      if (!uploadId) {
        throw new Error('Upload ID not found');
      }
      setUploadId(uploadId);

      // Upload content
      await uploadContent(file, uploadId, file.name, file.size);

      // Complete upload
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, fileName: file.name }),
      });
      const { downloadUrl } = await completeResponse.json();
      console.log('Download URL: ', downloadUrl)
      
      // Update state
      setDownloadUrl(downloadUrl);
      setUploadStatus('completed');

    } catch (error) {
      if (error instanceof UploadAbortedError) {
        console.log('Upload was aborted');
        // You can handle the aborted upload specifically here
        // For example, you might want to keep the 'paused' status
        setUploadStatus('paused');
      } else {
        console.error('Upload failed:', error);
        setUploadStatus('idle');
      }
    }
  };

  const handlePause = () => {
    
    // Change the status to paused
    setUploadStatus('paused');

    // Abort the upload
    abortController?.abort();
  };

  const handleResume = async () => {
    try {
      // Get the current progress from the server
      const response = await fetch(`/api/upload/get?uploadId=${uploadId}&fileName=${file.name}`);
      if (!response.ok) {
        throw new Error('Failed to get upload progress');
      }
      const progress = await response.json();
      
      // Get the content to resume upload
      const content = file.slice(progress.bytesUploaded);

      // Resume the upload
      await uploadContent(content, uploadId, file.name, content.size);

      // Complete the upload
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, fileName: file.name }),
      });

      const { downloadUrl } = await completeResponse.json();
      console.log('Download URL: ', downloadUrl)
      
      // Update state
      setDownloadUrl(downloadUrl);
      setUploadStatus('completed');
    } catch (error) {
      console.error('Failed to resume upload:', error);
      setUploadStatus('idle');
    }
  };

  const uploadContent = async (content, uploadId, fileName, contentSize) => {
    const url = `/api/upload/content?fileName=${encodeURIComponent(fileName)}&uploadId=${uploadId}&contentSize=${contentSize}`;

    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      setAbortController(controller);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true)
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');

      // Add a timeout to the request
      xhr.timeout = 600000; // 10 minutes

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
          reject(new Error('Failed to upload content'));
        }
      };

      xhr.onerror = () => reject(new Error('Failed to upload content'));
      xhr.onabort = () => reject(new UploadAbortedError());

      xhr.send(content);

      // Attach abort signal to the XHR request
      controller.signal.addEventListener('abort', () => xhr.abort());
    });
  };

  useEffect(() => {
    const onPageLoad = async () => {
      try {
        const response = await fetch('/fts/api/session/get');
        const data = await response.json();
        console.log(data)
        setUserName(data.user.firstName);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    onPageLoad();
  }, []);

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Resumable File Uploader</h1>
      </header>
      <main className="flex flex-col items-center justify-center p-4 bg-gray-100 gap-4">
        <div className="text-2xl font-bold text-black">Hello {userName}!</div>

        <div className="w-full max-w-2xl">
          <UploadForm
            file={file}
            uploadProgress={uploadProgress}
            uploadStatus={uploadStatus}
            downloadUrl={downloadUrl}
            onFileChange={handleFileChange}
            onUpload={handleStartUpload}
            onPause={handlePause}
            onResume={handleResume}
          />
        </div>
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2024 Resumable File Uploader</p>
      </footer>
    </div>
  );
}
