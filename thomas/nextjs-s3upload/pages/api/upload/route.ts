import { NextRequest, NextResponse } from 'next/server'
import { IncomingForm } from 'formidable'
import { uploadToS3 } from '@/lib/s3'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: NextRequest) {
  const form = new IncomingForm()

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err)
        return
      }

      const file = files.file[0]
      
      try {
        const result = await uploadToS3(file)
        resolve(NextResponse.json({ success: true, url: result.Location }))
      } catch (error) {
        reject(error)
      }
    })
  })
}