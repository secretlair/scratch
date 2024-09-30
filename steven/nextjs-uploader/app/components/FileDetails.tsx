export default function FileDetails({ file }: { file: File }) {
  return (
    <div className="text-left">
      <p className="font-semibold text-gray-700">{file.name}</p>
      <p className="text-sm text-gray-500">
        Size: {(file.size / 1024 / 1024).toFixed(2)} MB
      </p>
      <p className="text-sm text-gray-500">Type: {file.type || 'Unknown'}</p>
    </div>
  );
}