import { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, X } from "lucide-react";

export const Dropzone = ({
  onFileSelected,
  acceptedFormats = ".jpg, .jpeg, .png, .pdf",
  maxSizeMB = 15,
  label = "Drag and drop your scanned handwritten pages or photos here"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onFileSelected) onFileSelected(selectedFile);
          return 100;
        }
        return prev + 30;
      });
    }, 150);
  };

  const handleRemove = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onFileSelected) onFileSelected(null);
  };

  return (
    <div className="w-full space-y-3">
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 group ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-outline-variant hover:border-primary bg-surface-container-low/60 dark:bg-primary-container/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-surface-container-high dark:bg-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-primary dark:text-inverse-primary">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-on-surface dark:text-inverse-primary">
            {label}
          </p>
          <p className="text-xs text-on-surface-variant dark:text-outline mt-1">
            or <span className="text-brand dark:text-primary-fixed underline font-medium">browse local files</span>
          </p>
          <div className="mt-3 inline-block text-[11px] font-mono text-outline bg-surface-container dark:bg-primary px-2.5 py-1 rounded-lg border border-outline-variant/60">
            JPG, PNG, PDF (up to {maxSizeMB}MB)
          </div>
        </div>
      ) : (
        <div className="border border-outline-variant bg-surface-container-lowest dark:bg-primary-container rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-surface-container-high dark:bg-primary rounded-xl text-primary dark:text-inverse-primary border border-outline-variant/60">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface dark:text-inverse-primary">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-academic-green font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{uploadProgress === 100 ? "Ready for Optical Processing" : `Uploading ${uploadProgress}%`}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-surface-container transition-colors"
              title="Remove File"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary dark:bg-primary-fixed h-full rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
