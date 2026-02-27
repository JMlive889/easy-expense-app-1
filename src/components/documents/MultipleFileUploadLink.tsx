import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadDocument, validateFile } from '../../lib/documents';
import { useToast } from '../../contexts/ToastContext';

interface MultipleFileUploadLinkProps {
  parentDocumentId: string;
  onUploadComplete: () => void;
  inheritedMetadata: {
    tags?: string[];
    vendor?: string;
    category?: string;
    type?: string;
    amount?: number;
    billable?: boolean;
    reimbursable?: boolean;
    expenseReport?: string;
  };
  disabled?: boolean;
}

interface FileWithValidation {
  file: File;
  id: string;
  error?: string;
}

const MAX_FILES = 5;

export function MultipleFileUploadLink({
  parentDocumentId,
  onUploadComplete,
  inheritedMetadata,
  disabled = false
}: MultipleFileUploadLinkProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileWithValidation[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const { showToast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    if (selectedFiles.length + files.length > MAX_FILES) {
      showToast(`You can only upload up to ${MAX_FILES} files at once`, 'error');
      return;
    }

    const filesWithValidation: FileWithValidation[] = files.map(file => {
      const validation = validateFile(file);
      return {
        file,
        id: crypto.randomUUID(),
        error: validation.valid ? undefined : validation.error
      };
    });

    setSelectedFiles(prev => [...prev, ...filesWithValidation]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUploadAll = async () => {
    const validFiles = selectedFiles.filter(f => !f.error);

    if (validFiles.length === 0) {
      showToast('No valid files to upload', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: validFiles.length });

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < validFiles.length; i++) {
      const fileItem = validFiles[i];
      setUploadProgress({ current: i + 1, total: validFiles.length });

      try {
        const { error } = await uploadDocument({
          file: fileItem.file,
          displayName: fileItem.file.name,
          type: inheritedMetadata.type,
          category: inheritedMetadata.category,
          tags: inheritedMetadata.tags,
          vendor: inheritedMetadata.vendor,
          amount: inheritedMetadata.amount,
          billable: inheritedMetadata.billable,
          reimbursable: inheritedMetadata.reimbursable,
          expenseReport: inheritedMetadata.expenseReport,
          parentDocumentId: parentDocumentId,
          displayOrder: i
        });

        if (error) {
          results.failed++;
          results.errors.push(`${fileItem.file.name}: ${error.message}`);
        } else {
          results.successful++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${fileItem.file.name}: Upload failed`);
      }
    }

    setUploading(false);
    setSelectedFiles([]);
    setUploadProgress({ current: 0, total: 0 });

    if (results.successful > 0) {
      showToast(
        `Successfully uploaded ${results.successful} file${results.successful > 1 ? 's' : ''}`,
        'success'
      );
      onUploadComplete();
    }

    if (results.failed > 0) {
      showToast(
        `Failed to upload ${results.failed} file${results.failed > 1 ? 's' : ''}`,
        'error'
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validFileCount = selectedFiles.filter(f => !f.error).length;

  return (
    <div className="space-y-3">
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || selectedFiles.length >= MAX_FILES}
          className="text-sm text-gray-400 hover:text-gray-300 underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Upload Multiple
        </button>
        <p className="text-xs text-gray-500 mt-1">
          (Add up to {MAX_FILES} additional images or PDFs)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/heic,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="space-y-2">
            {selectedFiles.map(fileItem => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between gap-3 p-2 bg-gray-800 rounded border border-gray-700"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-300 truncate">
                      {fileItem.file.name}
                    </p>
                    {fileItem.error ? (
                      <p className="text-xs text-red-400">{fileItem.error}</p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(fileItem.id)}
                  disabled={uploading}
                  className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {validFileCount > 0 && (
            <button
              type="button"
              onClick={handleUploadAll}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    Uploading {uploadProgress.current} of {uploadProgress.total}...
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload All ({validFileCount})</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
