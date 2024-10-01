import * as s3Controller from '../controllers/s3';
import { Readable } from 'stream';

export const initializeUpload = async (fileName, fileType) => {
  try {
    console.log('Initializing upload:', fileName);
    const uploadId = await s3Controller.initializeMultipartUpload(fileName, fileType);
    console.log('Upload initialized:', uploadId);
    return uploadId;
  } catch (error) {
    console.error('Error initializing upload:', error);
    throw new Error('Error initializing upload');
  }
};

export const uploadContent = async (uploadId, fileName, readableStream, contentSize) => {
  const MIN_PART_SIZE = 5 * 1024 * 1024; // 5 MB
  const partSize = MIN_PART_SIZE;
  const totalParts = Math.ceil(contentSize / partSize);
  console.log('Total parts: ', totalParts);

  let uploadedSize = 0;
  let partNumber = 1;
  const uploadedParts = [];
  let tempBuffer = Buffer.alloc(0);

  try {
    for await (const chunk of readableStream) {
      tempBuffer = Buffer.concat([tempBuffer, chunk]);

      while (tempBuffer.length >= partSize) {
        const uploadChunk = tempBuffer.slice(0, partSize);
        tempBuffer = tempBuffer.slice(partSize);

        console.log('Uploading part:', partNumber, uploadChunk.length);
        const etag = await s3Controller.uploadPart(fileName, uploadId, partNumber, uploadChunk);
        console.log('Uploaded part:', partNumber, etag);

        uploadedParts.push({ PartNumber: partNumber, ETag: etag });
        partNumber++;
        uploadedSize += uploadChunk.length;
      }
    }

    // Upload any remaining data
    if (tempBuffer.length > 0) {
      console.log('Uploading final part:', partNumber, tempBuffer.length);
      const etag = await s3Controller.uploadPart(fileName, uploadId, partNumber, tempBuffer);
      console.log('Uploaded final part:', partNumber, etag);

      uploadedParts.push({ PartNumber: partNumber, ETag: etag });
      uploadedSize += tempBuffer.length;
    }

    return {
      message: 'Upload completed successfully',
      uploaded: uploadedSize,
      total: contentSize,
      parts: uploadedParts
    };
  } catch (error) {
    console.error('Error uploading content:', error);
    throw new Error('Error uploading content');
  }
};

export const completeUpload = async (uploadId, fileName) => {
  try {
    const parts = await s3Controller.listParts(fileName, uploadId);
    await s3Controller.completeMultipartUpload(fileName, uploadId, parts);
    return { message: 'Upload completed successfully' };
  } catch (error) {
    console.error('Error completing upload:', error);
    throw new Error('Error completing upload');
  }
};

export const getUploadProgress = async (uploadId, fileName) => {
  try {
    const parts = await s3Controller.listParts(fileName, uploadId);
    const uploadedSize = parts.reduce((total, part) => total + part.Size, 0);
    const totalParts = parts.length;

    return {
      uploadId,
      fileName,
      uploadedSize,
      totalParts,
      parts: parts.map(part => ({
        partNumber: part.PartNumber,
        size: part.Size,
        etag: part.ETag
      }))
    };
  } catch (error) {
    console.error('Error getting upload progress:', error);
    throw new Error('Error getting upload progress');
  }
};