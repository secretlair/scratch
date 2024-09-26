import { useState } from 'react';

export default function Upload() {
    const [file, setFile] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            alert('File uploaded successfully!');
        } else {
            alert('File upload failed.');
            let errorMessage = 'File upload failed.';
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.indexOf('application/json') !== -1) {
                    const errorData = await response.json();
                    errorMessage = `File upload failed: ${errorData.error} ${contentType}`;
                } else {
                    errorMessage = `File upload failed with status: ${response.status} ${contentType}`;
                }
            } catch (error) {
                console.error('Error parsing response:', error);
            }
            alert(errorMessage);
            }
    };

    return (
        <div>
            <h1>Upload a file to S3</h1>
            <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">Upload</button>
            </form>
        </div>
    );
}
