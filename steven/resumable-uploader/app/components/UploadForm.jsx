import Button from './Button';

export default function UploadForm({
  file,
  uploadProgress,
  uploadStatus,
  onFileChange,
  onUpload,
  onPauseResume
}) {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    onFileChange(selectedFile);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">Upload a File</h2>
        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Choose a file
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-100 file:text-blue-700
              hover:file:bg-blue-200"
          />
        </div>
        {file && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md border border-slate-200 text-slate-700">
            <h3 className="font-semibold mb-2">File Details:</h3>
            <p><span className="font-medium">Name:</span> {file.name}</p>
            <p><span className="font-medium">Size:</span> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><span className="font-medium">Type:</span> {file.type}</p>
          </div>
        )}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-blue-700">Upload Progress</span>
            <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
        <div className="flex justify-between space-x-4">
          <Button 
            onClick={onUpload} 
            disabled={!file || uploadStatus === 'uploading'}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {uploadStatus === 'idle' ? 'Start Upload' : 'Uploading...'}
          </Button>
          <Button
            onClick={onPauseResume}
            disabled={!file || uploadStatus === 'idle'}
            variant={uploadStatus === 'paused' ? 'secondary' : 'primary'}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {uploadStatus === 'paused' ? 'Resume' : 'Pause'}
          </Button>
        </div>
      </div>
    </div>
  );
}