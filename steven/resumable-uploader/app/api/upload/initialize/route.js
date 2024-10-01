import { initializeUpload } from '../../services/upload';

export async function POST(req) {
  console.log('initialize upload');
  const { fileName } = await req.json();
  try {
    const uploadId = await initializeUpload(fileName);
    return new Response(JSON.stringify({ uploadId }), {
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