// Removed direct import - will use dynamic import when needed
import { COLLECTIONS } from '../config/collections.js';

class FileUploadService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    this.allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @param {string} type - Expected file type ('image' or 'video')
   * @returns {Object} Validation result
   */
  validateFile(file, type = 'image') {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size must be less than ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file type
    const allowedTypes = type === 'image' ? this.allowedImageTypes : this.allowedVideoTypes;
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Resize image before upload to reduce file size
   * @param {File} file - Image file to resize
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @param {number} quality - JPEG quality (0-1)
   * @returns {Promise<File>} Resized image file
   */
  async resizeImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload progress photo
   * @param {File} file - Image file
   * @param {Object} metadata - Photo metadata
   * @returns {Promise<Object>} Upload result
   */
  async uploadProgressPhoto(file, metadata) {
    try {
      // Validate file
      const validation = this.validateFile(file, 'image');
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Resize image if needed
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) { // If larger than 2MB, resize
        processedFile = await this.resizeImage(file);
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('user', metadata.userId);
      formData.append('title', metadata.title);
      formData.append('category', metadata.category);
      formData.append('photo', processedFile);
      formData.append('notes', metadata.notes || '');
      formData.append('tags', JSON.stringify(metadata.tags || []));

      // Upload to PocketBase
      const record = await pocketbaseService.pb.collection(COLLECTIONS.PROGRESS_PHOTOS).create(formData);

      return {
        success: true,
        record,
        fileUrl: pocketbaseService.pb.files.getUrl(record, record.photo)
      };
    } catch (error) {
      console.error('Progress photo upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload training video
   * @param {File} file - Video file
   * @param {Object} metadata - Video metadata
   * @returns {Promise<Object>} Upload result
   */
  async uploadTrainingVideo(file, metadata) {
    try {
      // Validate file
      const validation = this.validateFile(file, 'video');
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('user', metadata.userId);
      formData.append('title', metadata.title);
      formData.append('sessionId', metadata.sessionId || '');
      formData.append('video', file);
      formData.append('description', metadata.description || '');
      formData.append('tags', JSON.stringify(metadata.tags || []));

      // Upload to PocketBase (you'll need to create a training_videos collection)
      const record = await pocketbaseService.pb.collection(COLLECTIONS.TRAINING_VIDEOS).create(formData);

      return {
        success: true,
        record,
        fileUrl: pocketbaseService.pb.files.getUrl(record, record.video)
      };
    } catch (error) {
      console.error('Training video upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get file URL from PocketBase record
   * @param {Object} record - PocketBase record
   * @param {string} filename - Filename field
   * @returns {string} File URL
   */
  getFileUrl(record, filename) {
    return pocketbaseService.pb.files.getUrl(record, filename);
  }

  /**
   * Delete file from PocketBase
   * @param {string} collection - Collection name
   * @param {string} recordId - Record ID
   * @returns {Promise<boolean>} Delete success
   */
  async deleteFile(collection, recordId) {
    try {
      await pocketbaseService.pb.collection(collection).delete(recordId);
      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  /**
   * Get user's progress photos
   * @param {string} userId - User ID
   * @param {string} category - Photo category (optional)
   * @returns {Promise<Array>} Progress photos
   */
  async getUserProgressPhotos(userId, category = null) {
    try {
      let filter = `user="${userId}"`;
      if (category) {
        filter += ` && category="${category}"`;
      }

      const records = await pocketbaseService.pb.collection(COLLECTIONS.PROGRESS_PHOTOS).getFullList({
        filter,
        sort: '-created'
      });

      return records.map(record => ({
        ...record,
        photoUrl: this.getFileUrl(record, record.photo)
      }));
    } catch (error) {
      console.error('Failed to fetch progress photos:', error);
      return [];
    }
  }

  /**
   * Create thumbnail from video
   * @param {File} videoFile - Video file
   * @param {number} time - Time in seconds to capture thumbnail
   * @returns {Promise<File>} Thumbnail image file
   */
  async createVideoThumbnail(videoFile, time = 1) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.addEventListener('loadedmetadata', () => {
        video.currentTime = time;
      });

      video.addEventListener('seeked', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            const thumbnailFile = new File([blob], `thumbnail_${videoFile.name}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(thumbnailFile);
          },
          'image/jpeg',
          0.8
        );
      });

      video.addEventListener('error', reject);
      video.src = URL.createObjectURL(videoFile);
    });
  }

  /**
   * Upload file with progress tracking
   * @param {File} file - File to upload
   * @param {Object} metadata - File metadata
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadWithProgress(file, metadata, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      // Prepare form data based on file type
      Object.keys(metadata).forEach(key => {
        if (key === 'tags' && Array.isArray(metadata[key])) {
          formData.append(key, JSON.stringify(metadata[key]));
        } else {
          formData.append(key, metadata[key]);
        }
      });

      // Determine file field name based on type
      const fileFieldName = file.type.startsWith('image/') ? 'photo' : 'video';
      formData.append(fileFieldName, file);

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              record: response,
              fileUrl: this.getFileUrl(response, response[fileFieldName])
            });
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // Determine collection based on file type
      const collection = file.type.startsWith('image/') ? COLLECTIONS.PROGRESS_PHOTOS : COLLECTIONS.TRAINING_VIDEOS;
      const url = `${pocketbaseService.pb.baseUrl}/api/collections/${collection}/records`;

      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${pocketbaseService.pb.authStore.token}`);
      xhr.send(formData);
    });
  }

  /**
   * Batch upload multiple files
   * @param {Array<File>} files - Files to upload
   * @param {Function} metadataGenerator - Function to generate metadata for each file
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Upload results
   */
  async batchUpload(files, metadataGenerator, onProgress) {
    const results = [];
    let completed = 0;

    for (const file of files) {
      try {
        const metadata = metadataGenerator(file);
        const result = await this.uploadWithProgress(
          file,
          metadata,
          (fileProgress) => {
            const totalProgress = ((completed / files.length) * 100) + (fileProgress / files.length);
            onProgress(totalProgress, file.name);
          }
        );
        results.push(result);
        completed++;
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          filename: file.name
        });
        completed++;
      }
    }

    return results;
  }

  /**
   * Compress image before upload
   * @param {File} file - Image file
   * @param {number} quality - Compression quality (0-1)
   * @returns {Promise<File>} Compressed image
   */
  async compressImage(file, quality = 0.7) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;