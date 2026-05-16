import { useRef, useState, useEffect, useId } from 'react';
import Icon from '../Icon';

interface FileUploadFieldProps {
  label?: string;
  name?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onFileSelect: (files: File[]) => void;
  error?: string;
  fullWidth?: boolean;
}

export const FileUploadField = ({
  label,
  name,
  accept,
  multiple = false,
  maxFiles,
  onFileSelect,
  error,
  fullWidth = false,
}: FileUploadFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // cleanup blob URLs
  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  // =========================
  // PROCESS FILES
  // =========================
  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const fileArray = Array.from(fileList);

    const nextFiles = multiple
      ? [...files, ...fileArray]
      : [fileArray[0]];

    // MAX FILE LIMIT
    if (multiple && maxFiles && nextFiles.length > maxFiles) {
      setLocalError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setLocalError(null);
    setFiles(nextFiles);
    onFileSelect(nextFiles);

    const newPreviews = nextFiles.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    );

    setPreviews(newPreviews);
  };

  // =========================
  // REMOVE FILE
  // =========================
  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFileSelect(updatedFiles);

    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
  };

  // =========================
  // DRAG REORDER
  // =========================
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDropItem = (index: number) => {
    if (dragIndex === null) return;

    const reordered = [...files];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, removed);

    setFiles(reordered);
    onFileSelect(reordered);

    const newPreviews = reordered.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    );

    setPreviews(newPreviews);
    setDragIndex(null);
  };

  return (
    <div className={`${fullWidth ? 'w-full' : 'w-72'} flex flex-col gap-2`}>

      {/* LABEL */}
      {label && (
        <label
          htmlFor={id}
          className="text-sm text-text-muted font-semibold uppercase tracking-wider ml-1"
        >
          {label}
        </label>
      )}

      {/* DROP AREA */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          processFiles(e.dataTransfer.files);
        }}
        className={`
          relative cursor-pointer
          border border-border-muted rounded-xl
          bg-bg-light
          min-h-32 p-4
          flex items-center justify-center
          transition-all duration-200
          hover:border-primary/40
          ${isDragging ? 'border-primary bg-primary/5' : ''}
          ${error || localError ? 'border-danger bg-danger/5' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          id={id}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            processFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* EMPTY STATE */}
        {files.length === 0 && (
          <div className="flex flex-col items-center gap-1 text-center">
            <Icon iconName="FaCloud" size={28} className="text-text-muted" />
            <span className="text-sm text-text">
              Click or drag files to upload
            </span>
            <span className="text-xs text-text-muted">
              {accept || 'Any file type'} {maxFiles ? `• Max ${maxFiles}` : ''}
            </span>
          </div>
        )}

        {/* PREVIEW GRID */}
        {files.length > 0 && (
          <div
            className={`
              absolute inset-0 z-0 p-2
              ${multiple ? 'grid grid-cols-3 gap-2' : 'w-full h-full'}
            `}
          >
            {files.map((file, index) => (
              <div
                key={index}
                draggable={multiple}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropItem(index)}
                className={`
                  relative rounded-lg overflow-hidden
                  ${multiple ? 'cursor-move' : 'w-full h-full'}
                `}
              >
                {file.type.startsWith('image/') ? (
                  <img
                    src={previews[index]}
                    className={`
                      w-full h-full
                      ${multiple ? 'object-cover' : 'object-contain'}
                    `}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-muted bg-bg-light">
                    {file.name}
                  </div>
                )}

                {/* REMOVE BUTTON */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-1 right-1 bg-bg-dark text-text-muted rounded-full p-1">
                  <Icon iconName="FaXmark" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ERROR */}
      {(error || localError) && (
        <span className="text-sm font-medium text-danger ml-1">
          {error || localError}
        </span>
      )}
    </div>
  );
};