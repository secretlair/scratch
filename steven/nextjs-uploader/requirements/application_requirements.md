# Project Overview:

This project aims to develop a prototype for a resumable file uploader to Amazon S3, leveraging S3's multipart upload capability to support pause and resume functionality. The uploader will allow users to upload large files efficiently, providing the ability to pause the upload at any moment and resume it later without losing progress. When a user pauses the upload, the client will immediately stop reading data and finalize the current part in progress. Upon resuming, the client will request the server for the current upload progress and continue uploading from the last known offset. The prototype will utilize Next.js for both the graphical user interface and server-side endpoints, ensuring a seamless and responsive user experience.

# Feature Requirements:

1. **File Upload Interface**:
   - A user-friendly upload page (`/upload`) where users can select files to upload.
   - Display of selected file details, such as name, size, and type.
   - Real-time progress bar indicating the upload status.
   - Support for large files exceeding typical size limits by using multipart uploads.

2. **Pause and Resume Functionality**:
   - **Pause Upload**: Users can pause the upload at any time, which will stop the client from reading additional data and finalize the current part being uploaded to S3.
   - **Resume Upload**: Upon resuming, the client will query the server for the current upload progress (already received data) and continue uploading from the appropriate offset.
   - Visual indicators for paused and active upload states.

3. **Server Endpoints**:
   - **Initialize Upload** (`/api/upload/initialize`): Starts a new multipart upload and returns an `uploadId` to the client.
   - **Upload Content** (`/api/upload/content`): Handles the upload it receives the stream and it needs to split it into parts (if needed) and upload each part to S3. This needs to be resumable, so when paused the server needs to save the received data and the offset, so when resumed the server can continue the upload from the last saved offset.
   - **Complete Upload** (`/api/upload/complete`): After all parts are uploaded, this endpoint finalizes the multipart upload on S3.
   - **Get Upload Progress** (`/api/upload/progress`): Returns the list of uploaded parts and their sizes for a given `uploadId`.

4. **Client-Side Logic**:
   - Efficiently read and send streams to the server.
   - Handle network interruptions gracefully, allowing for resumption without data loss.
   - Validate file types and sizes before initiating the upload.

5. **Responsive Design**:
   - Mobile-first approach ensuring the interface is responsive and user-friendly across various devices and screen sizes.

6. **Security Considerations**:
   - Secure handling of AWS credentials using environment variables and server-side logic.
   - Input validation and error handling to prevent security vulnerabilities.

# Relevant Documentation:

- **Amazon S3 Multipart Upload**: [AWS S3 Multipart Upload Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- **AWS SDK for JavaScript (v3)**: [AWS SDK v3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html)
- **Next.js Documentation**: [Next.js Docs](https://nextjs.org/docs)
- **Resumable File Upload Concepts**: [Resumable Uploads](https://en.wikipedia.org/wiki/Resumable_upload)

# Proposed File Structure:

```
nextjs-uploader/
│
├── app/
│   ├── components/
│   │   ├── UploadForm.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── PauseButton.tsx
│   │   ├── ResumeButton.tsx
│   │   └── FileDetails.tsx
│   ├── upload/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── pages/
│   └── api/
│       └── upload/
│           ├── initialize.ts
│           ├── part.ts
│           ├── complete.ts
│           └── progress.ts
│
├── public/
│   └── favicon.ico
│
├── node_modules/
│
├── .env.local
├── .eslintrc.json
├── .gitignore
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
└── tailwind.config.js
```

# Rules:

- **Mobile-First Approach**: Design the user interface with mobile users in mind first, then scale up for larger screens.
- **Responsive Design**: Ensure all components are responsive and work seamlessly across different screen sizes.
- **Component Organization**: All reusable UI components must be placed in the `components/` folder.
- **Page Organization**: All pages must be in the `app/` folder, following Next.js conventions.
- **TypeScript Usage**: Utilize TypeScript for type safety across the project.
- **AWS SDK**: Use AWS SDK for JavaScript v3 for interacting with S3.
- **Security Best Practices**:
  - Do not expose AWS credentials or sensitive data on the client side.
  - Use server-side environment variables to store secrets.
- **Error Handling**: Implement robust error handling both on the client and server sides to handle exceptions and provide user feedback.
- **Code Quality**:
  - Follow consistent coding standards and style guidelines.
  - Use ESLint and Prettier for linting and formatting.
- **Modularity**: Write modular and reusable code to make maintenance and scalability easier.
- **Documentation**: Comment code where necessary and maintain a clear README with setup instructions.
