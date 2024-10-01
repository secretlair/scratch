import { getUploadProgress } from '../../services/upload';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get('uploadId');
  const fileName = searchParams.get('fileName');

  try {
    const progress = await getUploadProgress(uploadId, fileName);
    return new Response(JSON.stringify(progress), {
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