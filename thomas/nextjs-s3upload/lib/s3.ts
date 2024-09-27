import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createReadStream } from 'fs'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToS3(file: any) {
  const fileStream = createReadStream(file.filepath)

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `uploads/${Date.now()}-${file.originalFilename}`,
    Body: fileStream,
  }

  const command = new PutObjectCommand(uploadParams)

  try {
    const response = await s3Client.send(command)
    return {
      success: true,
      Location: `https://${uploadParams.Bucket}.s3.amazonaws.com/${uploadParams.Key}`,
    }
  } catch (error) {
    console.error('Error uploading to S3:', error)
    throw error
  }
}
