import { completeUpload } from '../../services/upload';

export async function POST(req) {
  const { uploadId, fileName } = await req.json();
  try {
    const result = await completeUpload(uploadId, fileName);
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