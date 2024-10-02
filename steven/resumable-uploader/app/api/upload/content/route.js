import { uploadContent } from '../../services/upload';

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 600, // 10 minutes
  },
};

export async function POST(req) {
  // Extract uploadId and fileName from the query parameters
  const uploadId = req.nextUrl.searchParams.get('uploadId');
  const fileName = req.nextUrl.searchParams.get('fileName');
  const contentSize = req.nextUrl.searchParams.get('contentSize');

  if (!uploadId || !fileName || !contentSize) {
    return new Response(JSON.stringify({ error: 'Missing uploadId, fileName or contentSize' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {

    // The body is a stream.
    const reader = req.body.getReader();

    // Pass the request body as a stream to the uploadContent function
    const result = await uploadContent(uploadId, fileName, reader, contentSize);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
