import { EmbeddableFileUploaderJsx } from '@/components/embeddable-file-uploader'

export default function UploadPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">File Upload</h1>
      <EmbeddableFileUploaderJsx />
    </div>
  )
}
