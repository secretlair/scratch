import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, ListPartsCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileName, uploadId } = req.query;

  try {
    const command = new ListPartsCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName as string,
      UploadId: uploadId as string,
    });

    const { Parts } = await s3Client.send(command);

    res.status(200).json({ parts: Parts });
  } catch (error) {
    console.error('Error getting upload progress:', error);
    res.status(500).json({ message: 'Error getting upload progress' });
  }
}