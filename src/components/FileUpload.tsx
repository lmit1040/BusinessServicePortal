import { useState, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadFileToSupabase, deleteFileFromSupabase } from '../lib/supabase-storage';

interface FileUploadProps {
  bucket: 'product-images' | 'product-videos';
  accept?: string;
  maxSizeMB?: number;
  currentFileUrl?: string;
  onUploadComplete: (fileUrl: string) => void;
  onDelete?: () => void;
  label?: string;
  description?: string;
}

export function FileUpload({
  bucket,
  accept,
  maxSizeMB = 50,
  currentFileUrl,
  onUploadComplete,
  onDelete,
  label = 'Upload File',
  description,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError('');
    setSuccess(false);
    setUploading(true);
    setProgress(0);

    try {
      const fileUrl = await uploadFileToSupabase(file, bucket, (progressData) => {
        setProgress(progressData.percentage);
      });

      onUploadComplete(fileUrl);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentFileUrl) return;

    setError('');
    setUploading(true);

    try {
      await deleteFileFromSupabase(currentFileUrl, bucket);
      if (onDelete) {
        onDelete();
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return decodeURIComponent(fileName).split('-').slice(1).join('-');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        {currentFileUrl && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading}
            className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
          >
            Remove File
          </button>
        )}
      </div>

      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}

      {!currentFileUrl ? (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={`file-upload-${bucket}`}
          />
          <label
            htmlFor={`file-upload-${bucket}`}
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploading
                ? 'border-slate-300 bg-slate-50 cursor-not-allowed'
                : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm text-slate-600">Uploading... {progress}%</p>
                <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">Max file size: {maxSizeMB}MB</p>
              </div>
            )}
          </label>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{getFileName(currentFileUrl)}</p>
            <p className="text-xs text-slate-500 truncate">{currentFileUrl}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">File uploaded successfully!</p>
        </div>
      )}
    </div>
  );
}
