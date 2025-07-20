import React, { useState, useRef, useCallback } from 'react';
import { fileUploadService } from '../services/fileUpload.service';

const FileUploadZone = ({
  accept = 'image/*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  className = '',
  children,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [disabled]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, []);

  const handleFiles = async (files) => {
    if (!files.length) return;

    // Filter files if not multiple
    const filesToProcess = multiple ? files : [files[0]];

    // Validate files
    const validFiles = [];
    const errors = [];

    for (const file of filesToProcess) {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
        continue;
      }

      // Check file type based on accept prop
      if (accept !== '*/*') {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const isAccepted = acceptedTypes.some(type => {
          if (type.includes('*')) {
            const baseType = type.split('/')[0];
            return file.type.startsWith(baseType);
          }
          return file.type === type;
        });

        if (!isAccepted) {
          errors.push(`${file.name}: File type not accepted`);
          continue;
        }
      }

      validFiles.push(file);
    }

    // Report errors
    if (errors.length > 0) {
      onUploadError?.(errors);
    }

    // Process valid files
    if (validFiles.length > 0) {
      await processFiles(validFiles);
    }
  };

  const processFiles = async (files) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      onUploadStart?.(files);

      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // Create file preview
          const preview = await createFilePreview(file);
          
          const fileData = {
            file,
            preview,
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          };

          results.push({
            success: true,
            data: fileData
          });

          // Update progress
          const progress = ((i + 1) / files.length) * 100;
          setUploadProgress(progress);
          onUploadProgress?.(progress, file.name);

        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            filename: file.name
          });
        }
      }

      onUploadComplete?.(results);

    } catch (error) {
      onUploadError?.([error.message]);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const createFilePreview = (file) => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        // Create video thumbnail
        fileUploadService.createVideoThumbnail(file)
          .then(thumbnailFile => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(thumbnailFile);
          })
          .catch(reject);
      } else {
        // For other file types, return a generic icon
        resolve(null);
      }
    });
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const defaultContent = (
    <div className="text-center p-8">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="text-lg font-medium text-foreground mb-2">
        {isDragging ? 'Drop files here' : 'Upload files'}
      </div>
      <div className="text-sm text-muted-foreground mb-4">
        Drag and drop files here, or click to select
      </div>
      <button
        type="button"
        onClick={openFileDialog}
        disabled={disabled || isUploading}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Choose Files
      </button>
      <div className="text-xs text-muted-foreground mt-2">
        Max size: {Math.round(maxSize / (1024 * 1024))}MB
      </div>
    </div>
  );

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg transition-all duration-200
        ${isDragging 
          ? 'border-primary bg-primary/10' 
          : 'border-border hover:border-primary/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={openFileDialog}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {children || defaultContent}

      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg font-medium text-foreground mb-2">
              Processing files...
            </div>
            <div className="w-48 bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {Math.round(uploadProgress)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// File Preview Component
export const FilePreview = ({ file, onRemove, className = '' }) => {
  const [preview, setPreview] = useState(null);

  React.useEffect(() => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [file]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {/* File Preview */}
        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {preview ? (
            <img
              src={preview}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-2xl">
              {file.type.startsWith('video/') ? '🎥' : '📄'}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {file.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </div>
          <div className="text-xs text-muted-foreground">
            {file.type}
          </div>
        </div>

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={() => onRemove(file)}
            className="text-destructive hover:text-destructive/80 p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Multi-file Upload Component with Preview
export const MultiFileUpload = ({
  accept = 'image/*',
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  onFilesChange,
  className = ''
}) => {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const handleUploadComplete = (results) => {
    const successfulFiles = results
      .filter(result => result.success)
      .map(result => result.data);

    const newFiles = [...files, ...successfulFiles];
    
    // Limit number of files
    const limitedFiles = newFiles.slice(0, maxFiles);
    
    setFiles(limitedFiles);
    onFilesChange?.(limitedFiles);
  };

  const handleUploadError = (uploadErrors) => {
    setErrors(uploadErrors);
    setTimeout(() => setErrors([]), 5000);
  };

  const removeFile = (fileToRemove) => {
    const updatedFiles = files.filter(file => file.file !== fileToRemove);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  const clearAll = () => {
    setFiles([]);
    onFilesChange?.([]);
  };

  return (
    <div className={className}>
      {/* Upload Zone */}
      <FileUploadZone
        accept={accept}
        multiple={true}
        maxSize={maxSize}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        disabled={files.length >= maxFiles}
      />

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-sm font-medium text-destructive mb-1">Upload Errors:</div>
          <ul className="text-sm text-destructive space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-foreground">
              Selected Files ({files.length}/{maxFiles})
            </div>
            <button
              onClick={clearAll}
              className="text-sm text-destructive hover:text-destructive/80"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((fileData, index) => (
              <FilePreview
                key={index}
                file={fileData.file}
                onRemove={removeFile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;