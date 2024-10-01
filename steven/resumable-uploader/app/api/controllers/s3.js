import { S3Client, CompleteMultipartUploadCommand, ListPartsCommand, CreateMultipartUploadCommand, UploadPartCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const initializeMultipartUpload = async (key, contentType) => {
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const { UploadId } = await s3Client.send(command);
    return UploadId;
  } catch (error) {
    console.error('Error initializing multipart upload:', error);
    throw new Error('Error initializing multipart upload');
  }
};

export const uploadPart = async (key, uploadId, partNumber, body) => {
  try {
    const command = new UploadPartCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
    });

    const { ETag } = await s3Client.send(command);
    return ETag;
  } catch (error) {
    console.error('Error uploading part:', error);
    throw new Error('Error uploading part');
  }
};

export const completeMultipartUpload = async (key, uploadId, parts) => {
  try {
    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });
    await s3Client.send(command);
  } catch (error) {
    console.error('Error completing multipart upload:', error);
    throw new Error('Error completing multipart upload');
  }
};

export const listParts = async (key, uploadId) => {
  try {
    const command = new ListPartsCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
    });
    const response = await s3Client.send(command);
    return response?.Parts || [];
  } catch (error) {
    console.error('Error listing parts:', error);
    throw new Error('Error listing parts');
  }
};

export const getDownloadUrl = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    // Generate a signed URL that expires in 1 hour (3600 seconds)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Error generating signed URL');
  }
};