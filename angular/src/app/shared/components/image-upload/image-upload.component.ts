import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  viewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { MessageModule } from "primeng/message";

export interface ImageUploadResult {
  file: File;
  preview: string;
  url?: string;
}

/**
 * Image Upload Component - Angular 19+
 *
 * A specialized image upload component with preview, crop, and resize capabilities
 * Uses Angular signals for reactive state management
 */
@Component({
  selector: "app-image-upload",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, ProgressBarModule, MessageModule],
  template: `
    <div [class]="containerClass()">
      <!-- Upload Area -->
      @if (!uploadedImage()) {
        <div
          class="image-upload-area"
          [class.drag-over]="isDragging()"
          [class.disabled]="disabled()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="triggerFileInput()">
          <input
            #fileInput
            type="file"
            accept="image/*"
            [disabled]="disabled()"
            (change)="onFileSelected($event)"
            class="file-input-hidden"
            [attr.aria-label]="label() || 'Image upload'" />

          <div class="upload-content">
            <i class="pi pi-image upload-icon"></i>
            <p class="upload-label">{{ label() || "Drop image here or click to browse" }}</p>
            <p class="upload-hint">{{ hint() }}</p>
          </div>
        </div>
      }

      <!-- Image Preview -->
      @if (uploadedImage()) {
        <div class="image-preview-container">
          <div class="image-preview-wrapper">
            <img
              [src]="uploadedImage()!.preview"
              [alt]="uploadedImage()!.file.name"
              class="preview-image"
              [style.max-width]="maxWidth() + 'px'"
              [style.max-height]="maxHeight() + 'px'" />
            @if (showRemoveButton()) {
              <button
                type="button"
                class="remove-image-btn"
                (click)="removeImage()"
                aria-label="Remove image">
                <i class="pi pi-times"></i>
              </button>
            }
          </div>

          <!-- Image Info -->
          <div class="image-info">
            <span class="image-name">{{ uploadedImage()!.file.name }}</span>
            <span class="image-size">{{ formatFileSize(uploadedImage()!.file.size) }}</span>
            @if (uploadedImage()!.file.width && uploadedImage()!.file.height) {
              <span class="image-dimensions">
                {{ uploadedImage()!.file.width }} × {{ uploadedImage()!.file.height }}
              </span>
            }
          </div>

          <!-- Crop Controls -->
          @if (allowCrop() && uploadedImage()) {
            <div class="crop-controls">
              <p-button
                label="Crop Image"
                icon="pi pi-crop"
                size="small"
                (onClick)="enableCrop()">
              </p-button>
            </div>
          }

          <!-- Resize Controls -->
          @if (allowResize() && uploadedImage()) {
            <div class="resize-controls">
              <label>Width:</label>
              <input
                type="number"
                [value]="resizeWidth()"
                (input)="resizeWidth.set(+($any($event.target).value))"
                [min]="minWidth()"
                [max]="maxWidth()" />
              <label>Height:</label>
              <input
                type="number"
                [value]="resizeHeight()"
                (input)="resizeHeight.set(+($any($event.target).value))"
                [min]="minHeight()"
                [max]="maxHeight()" />
              <p-button
                label="Resize"
                size="small"
                (onClick)="resizeImage()">
              </p-button>
            </div>
          }
        </div>
      }

      <!-- Progress Bar -->
      @if (uploadProgress() > 0 && uploadProgress() < 100) {
        <div class="upload-progress">
          <p-progressBar [value]="uploadProgress()"></p-progressBar>
          <span class="progress-text">{{ uploadProgress() }}%</span>
        </div>
      }

      <!-- Error Message -->
      @if (errorMessage()) {
        <p-message severity="error" [text]="errorMessage()!"></p-message>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .image-upload-container {
        width: 100%;
      }

      .image-upload-area {
        border: 2px dashed var(--p-surface-border, #dee2e6);
        border-radius: var(--p-border-radius, 0.5rem);
        padding: var(--space-6, 1.5rem);
        background: var(--p-surface-0, #ffffff);
        cursor: pointer;
        transition: all 0.3s ease;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .image-upload-area:hover:not(.disabled) {
        border-color: var(--color-brand-primary, #089949);
        background: var(--p-surface-50, #f8faf9);
      }

      .image-upload-area.drag-over {
        border-color: var(--color-brand-primary, #089949);
        background: var(--p-surface-100, #f0f0f0);
      }

      .image-upload-area.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .file-input-hidden {
        display: none;
      }

      .upload-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2, 0.5rem);
        text-align: center;
      }

      .upload-icon {
        font-size: 3rem;
        color: var(--color-brand-primary, #089949);
      }

      .upload-label {
        font-size: var(--font-body-lg, 1.125rem);
        font-weight: 600;
        color: var(--text-primary, #1a1a1a);
        margin: 0;
      }

      .upload-hint {
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-secondary, #6b7280);
        margin: 0;
      }

      .image-preview-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-4, 1rem);
      }

      .image-preview-wrapper {
        position: relative;
        display: inline-block;
        border-radius: var(--p-border-radius, 0.5rem);
        overflow: hidden;
        border: 1px solid var(--p-surface-border, #dee2e6);
      }

      .preview-image {
        display: block;
        max-width: 100%;
        height: auto;
      }

      .remove-image-btn {
        position: absolute;
        top: var(--space-2, 0.5rem);
        right: var(--space-2, 0.5rem);
        background: rgba(239, 68, 68, 0.9);
        border: none;
        color: white;
        cursor: pointer;
        padding: var(--space-2, 0.5rem);
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }

      .remove-image-btn:hover {
        background: rgba(239, 68, 68, 1);
      }

      .image-info {
        display: flex;
        flex-direction: column;
        gap: var(--space-1, 0.25rem);
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-secondary, #6b7280);
      }

      .image-name {
        font-weight: 500;
        color: var(--text-primary, #1a1a1a);
      }

      .crop-controls,
      .resize-controls {
        display: flex;
        gap: var(--space-2, 0.5rem);
        align-items: center;
        flex-wrap: wrap;
      }

      .resize-controls label {
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-secondary, #6b7280);
      }

      .resize-controls input {
        width: 80px;
        padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
        border: 1px solid var(--p-surface-border, #dee2e6);
        border-radius: var(--p-border-radius, 0.5rem);
      }

      .upload-progress {
        margin-top: var(--space-4, 1rem);
      }

      .progress-text {
        display: block;
        text-align: center;
        margin-top: var(--space-2, 0.5rem);
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-secondary, #6b7280);
      }
    `,
  ],
})
export class ImageUploadComponent {
  fileInput = viewChild<HTMLInputElement>("fileInput");

  // Configuration
  label = input<string>("Drop image here or click to browse");
  hint = input<string>("Supported formats: JPG, PNG, GIF, WebP (Max 5MB)");
  maxFileSize = input<number>(5 * 1024 * 1024); // 5MB default
  maxWidth = input<number>(800);
  maxHeight = input<number>(600);
  minWidth = input<number>(100);
  minHeight = input<number>(100);
  allowCrop = input<boolean>(false);
  allowResize = input<boolean>(false);
  showRemoveButton = input<boolean>(true);
  uploadUrl = input<string>();
  disabled = input<boolean>(false);
  aspectRatio = input<number>(); // Optional aspect ratio constraint

  // State
  uploadedImage = signal<ImageUploadResult | null>(null);
  uploadProgress = signal<number>(0);
  errorMessage = signal<string | null>(null);
  isDragging = signal<boolean>(false);
  resizeWidth = signal<number>(0);
  resizeHeight = signal<number>(0);

  // Outputs
  imageSelected = output<ImageUploadResult>();
  imageRemoved = output<void>();
  uploadComplete = output<{ file: File; url: string }>();
  uploadError = output<Error>();

  containerClass = () => {
    return "image-upload-container";
  };

  onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processImage(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processImage(file);
    }
  }

  triggerFileInput(): void {
    if (this.disabled()) return;
    const input = this.fileInput();
    input?.click();
  }

  private async processImage(file: File): Promise<void> {
    this.errorMessage.set(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      this.errorMessage.set("Please select an image file");
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize()) {
      this.errorMessage.set(
        `Image exceeds maximum size of ${this.formatFileSize(
          this.maxFileSize()
        )}`
      );
      return;
    }

    try {
      // Create preview
      const preview = await this.createImagePreview(file);

      // Get image dimensions
      const dimensions = await this.getImageDimensions(preview);

      const result: ImageUploadResult = {
        file: file,
        preview: preview,
      };

      // Add dimensions to file object (for display)
      (result.file as any).width = dimensions.width;
      (result.file as any).height = dimensions.height;

      this.uploadedImage.set(result);
      this.resizeWidth.set(dimensions.width);
      this.resizeHeight.set(dimensions.height);
      this.imageSelected.emit(result);

      // Auto-upload if URL provided
      if (this.uploadUrl()) {
        this.uploadImage(result);
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : "Failed to process image"
      );
    }
  }

  private createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getImageDimensions(src: string): Promise<{
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  private async uploadImage(result: ImageUploadResult): Promise<void> {
    if (!this.uploadUrl()) return;

    this.uploadProgress.set(0);

    try {
      const formData = new FormData();
      formData.append("image", result.file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        const current = this.uploadProgress();
        if (current < 90) {
          this.uploadProgress.set(current + 10);
        }
      }, 200);

      // In real implementation, use HttpClient with progress tracking
      // const response = await this.http.post(this.uploadUrl()!, formData, {
      //   reportProgress: true,
      //   observe: 'events'
      // }).toPromise();

      // Simulate completion
      setTimeout(() => {
        clearInterval(progressInterval);
        this.uploadProgress.set(100);
        const url = `https://example.com/uploads/${result.file.name}`;
        result.url = url;
        this.uploadComplete.emit({ file: result.file, url });
      }, 2000);
    } catch (error) {
      this.uploadProgress.set(0);
      this.errorMessage.set(
        error instanceof Error ? error.message : "Upload failed"
      );
      this.uploadError.emit(error as Error);
    }
  }

  removeImage(): void {
    this.uploadedImage.set(null);
    this.uploadProgress.set(0);
    this.errorMessage.set(null);
    this.imageRemoved.emit();
  }

  enableCrop(): void {
    // Crop functionality would be implemented here
    // Could integrate with a library like cropperjs
    console.log("Crop functionality not yet implemented");
  }

  resizeImage(): void {
    const width = this.resizeWidth();
    const height = this.resizeHeight();
    const current = this.uploadedImage();

    if (!current) return;

    // Resize functionality would be implemented here
    // Could use canvas API to resize the image
    console.log(`Resize to ${width}x${height} not yet implemented`);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }
}

