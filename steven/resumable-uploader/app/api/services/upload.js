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
  const PART_SIZE = 1024 * 1024 * 1024; // 1 GB
  let uploadedSize = 0;
  let partNumber = 1;
  const uploadedParts = [];

  console.log('uploadContent', fileName, contentSize);
  try {
    while (uploadedSize < contentSize) {

      console.log('uploadedContent', uploadedSize);

      // Calculate the part size
      const partSize = Math.min(PART_SIZE, contentSize - uploadedSize);
      let partStream = await streamToBuffer(readableStream);
      //createPartStream(readableStream, partSize);

      // Upload the part
      let retryCount = 0;
      while (retryCount < 3) {
        try {

          console.log('Uploading part:', partNumber, partSize);
          const etag = await s3Controller.uploadPart(
            fileName, 
            uploadId, 
            partNumber, 
            partStream,
            partSize
          );
          console.log('Uploaded part:', partNumber, etag);
          uploadedParts.push({ PartNumber: partNumber, ETag: etag });
          partNumber++;
          uploadedSize += partSize;

          // Success, break the retry loop
          break;
        } catch (error) {
          if (error.code === 'RequestAbortedError') {
            console.log('Upload stream closed unexpectedly. Assuming paused or cancelled.');
            break;
          }
          if (error.code === 'RequestTimeout' || error.name === 'RequestTimeout') {
            retries++;
            console.log(`Retry ${retries} for part ${partNumber}`);
            await exponentialBackoff(retries);
            // Reset the stream for retry
            partStream.destroy();
            partStream = createPartStream(readableStream, partSize);
          }
          throw error;
        }
      }

      if (retryCount >= 3) {
        console.error('Failed to upload part after 3 retries');
        throw new Error('Failed to upload part after 3 retries');
      }
    }

    return {
      message: uploadedSize < contentSize ? 'Upload incomplete' : 'Upload completed successfully',
      uploaded: uploadedSize,
      total: contentSize,
      parts: uploadedParts
    };
  } catch (error) {
    console.error('Error uploading content:', error);
    //throw new Error('Error uploading content');
  }
};

export const completeUpload = async (uploadId, fileName) => {
  try {
    const parts = await s3Controller.listParts(fileName, uploadId);
    await s3Controller.completeMultipartUpload(fileName, uploadId, parts);
    const downloadUrl = await s3Controller.getDownloadUrl(fileName);
    return { message: 'Upload completed successfully', downloadUrl };
  } catch (error) {
    console.error('Error completing upload:', error);
    throw new Error('Error completing upload');
  }
};

export const getUploadProgress = async (uploadId, fileName) => {
  try {
    const parts = await s3Controller.listParts(fileName, uploadId);
    const bytesUploaded = parts.reduce((total, part) => total + part.Size, 0);
    const totalParts = parts.length;

    return {
      uploadId,
      fileName,
      bytesUploaded,
      totalParts,
    };
  } catch (error) {
    console.error('Error getting upload progress:', error);
    throw new Error('Error getting upload progress');
  }
};


// Helpers
const exponentialBackoff = (retryNumber) => {
  const delay = Math.min(1000 * (2 ** retryNumber), 30000); // Max delay of 30 seconds
  return new Promise(resolve => setTimeout(resolve, delay));
};


function createPartStream(readableStream, partSize) {
  let bytesRead = 0;

  return new Readable({
    async read(size) {
      try {

        // The part is complete
        if (bytesRead >= partSize) {
          this.push(null);
          return;
        }

        // Read the next chunk
        const remainingBytes = partSize - bytesRead;
        const chunkSize = Math.min(size, remainingBytes);
        
        const chunkObj = await readableStream.read(chunkSize);
        
        // The stream is done
        if (chunkObj.done) {
          this.push(null);
          return;
        }

        // Push the chunk to the stream
        if (chunkObj.value) {
          bytesRead += chunkObj.value.length;
          this.push(chunkObj.value);
        }
      } catch (error) {
        console.error('Error reading stream:', error);
        this.destroy(error);
      }
    }
  });
}


async function streamToBuffer(reader) {
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}