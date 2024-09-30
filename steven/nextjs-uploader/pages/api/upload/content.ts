import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, UploadPartCommand, ListPartsCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { parse } from 'path';

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const MIN_PART_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PARTS = 10000;

async function uploadPart(uploadId: string, objectKey: string, partNumber: number, body: Buffer) {
  const command = new UploadPartCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: objectKey,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: body,
  });

  const { ETag } = await s3Client.send(command);
  return ETag;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const uploadId = req.query.uploadId as string;
  if (!uploadId) {
    return res.status(400).json({ message: 'Upload ID is required' });
  }

  const fileName = req.query.fileName as string;
  if (!fileName) {
    return res.status(400).json({ message: 'File name is required' });
  }

  // Get content size from header
  const contentSize = parseInt(req.headers['content-length'] as string, 10);
  if (!contentSize) {
    return res.status(400).json({ message: 'Content length is required' });
  }

  // Calculate the part size
  const partSize = 5 * 1024 * 1024; // 5 MB

  // Calculate the total number of parts
  const totalParts = Math.ceil(contentSize / partSize);

  let buffer: Buffer = Buffer.alloc(0);
  let uploadedSize = 0;
  let partNumber = 1;

  const uploadStream = new Promise<void>((resolve, reject) => {
    req.on('data', async (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
      
      while (buffer.length >= partSize && partNumber <= totalParts) {
        let uploadChunk: Buffer;
        if (partNumber === totalParts) {
          // Last part - upload all remaining data
          uploadChunk = buffer;
        } else {
          uploadChunk = buffer.slice(0, partSize);
        }

        try {
          const etag = await uploadPart(uploadId, fileName, partNumber, uploadChunk);
          console.log('uploading part: ', partNumber, uploadChunk.length);
          console.log('uploaded part: ', partNumber, etag);
          partNumber++;
          uploadedSize += uploadChunk.length;
          buffer = buffer.slice(uploadChunk.length);
        } catch (error) {
          reject(error);
          return;
        }
      }
    });

    req.on('end', async () => {
      try {
        if (buffer.length > 0 && partNumber <= totalParts) {
          // Upload any remaining data as the last part
          const etag = await uploadPart(uploadId, fileName, partNumber, buffer);
          console.log('uploading part: ', partNumber, buffer.length);
          console.log('uploaded part: ', partNumber, etag);
          uploadedSize += buffer.length;
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', (error) => {
      reject(error);
    });
  });

  // Start the upload stream
  try {
    await uploadStream;
    res.status(200).json({
      message: 'Upload completed successfully',
      uploaded: uploadedSize,
      total: contentSize,
    });
  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).json({ message: 'Error uploading parts' });
  }
}
