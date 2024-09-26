import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, CompleteMultipartUploadCommand, ListPartsCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileName, uploadId } = req.body;

  // Ask to s3 for the parts
  let parts;
  try {
    const command = new ListPartsCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      UploadId: uploadId,
    });
    const { Parts } = await s3Client.send(command);
    parts = Parts;
  } catch (error) {
    console.error('Error listing parts:', error);
    res.status(500).json({ message: 'Error listing parts' });
  }

  // Complete the upload
  try {
    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });

    await s3Client.send(command);

    res.status(200).json({ message: 'Upload completed successfully' });
  } catch (error) {
    console.error('Error completing upload:', error);
    res.status(500).json({ message: 'Error completing upload' });
  }
}