import aws from 'aws-sdk';
import { IncomingForm } from 'formidable';
import fs from 'fs';

// Check for required environment variables
const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    throw new Error('Missing required environment variables');
}

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ error: 'Error parsing the files' });
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileStream = fs.createReadStream(file.filepath);

        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: file.originalFilename,
            Body: fileStream,
            ContentType: file.mimetype,
        };

        try {
            const uploadResult = await new Promise((resolve, reject) => {
                s3.upload(params, (s3Err, data) => {
                    if (s3Err) reject(s3Err);
                    else resolve(data);
                });
            });

            // Clean up the temporary file
            fs.unlink(file.filepath, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting temporary file:', unlinkErr);
            });

            return res.status(200).json({ message: 'File uploaded successfully', data: uploadResult });
        } catch (uploadError) {
            console.error('Error uploading to S3:', uploadError);
            return res.status(500).json({ error: 'Error uploading the file', details: uploadError.message });
        }
    });
}
