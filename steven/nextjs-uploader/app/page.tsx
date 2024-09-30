import UploadForm from './components/UploadForm';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">S3 Resumable File Uploader</h1>
      <UploadForm />
    </div>
  );
}
