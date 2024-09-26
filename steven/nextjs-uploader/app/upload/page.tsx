import UploadForm from '../components/UploadForm';

export default function UploadPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Upload File to S3</h1>
      <UploadForm />
    </div>
  );
}