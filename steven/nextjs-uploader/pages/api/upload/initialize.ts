import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, CreateMultipartUploadCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// In-memory storage for upload data (replace with a database in production)
const uploads: Record<string, any> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileName, fileType, fileSize } = req.body;

  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      ContentType: fileType,
    });

    const { UploadId } = await s3Client.send(command);

    res.status(200).json({ uploadId: UploadId });
  } catch (error) {
    console.error('Error initializing upload:', error);
    res.status(500).json({ message: 'Error initializing upload' });
  }
}

