import Image from 'next/image'
import FileUpload from '@/components/FileUpload'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between relative">
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/happy-office-1-SslDU5dVa2DOw7Av0wrsEpFl06TeSD.jpg"
        alt="Modern office with diverse team members"
        fill
        style={{ objectFit: 'cover' }}
        quality={100}
        priority
      />
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="z-10 text-white text-center mt-16">
        <h1 className="text-5xl font-bold mb-4">File Upload Application</h1>
        <p className="text-2xl">Upload your files securely and efficiently</p>
      </div>
      <div className="z-10 mb-16">
        <FileUpload />
      </div>
    </main>
  )
}
