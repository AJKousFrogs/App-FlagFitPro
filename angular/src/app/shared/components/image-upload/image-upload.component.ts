import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  viewChild,
  inject,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../button/button.component";
import { ProgressBarModule } from "primeng/progressbar";
import { Message } from "primeng/message";
import { LoggerService } from "../../../core/services/logger.service";
import { timer } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MobileOptimizedImageDirective } from "../../directives/mobile-optimized-image.directive";

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
  imports: [
    CommonModule,
    ProgressBarModule,
    Message,
    ButtonComponent,
    MobileOptimizedImageDirective,
  ],
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
          (click)="triggerFileInput()"
        >
          <input
            #fileInput
            type="file"
            accept="image/*"
            [disabled]="disabled()"
            (change)="onFileSelected($event)"
            class="file-input-hidden"
            [attr.aria-label]="label() || 'Image upload'"
          />

          <div class="upload-content">
            <i class="pi pi-image upload-icon"></i>
            <p class="upload-label">
              {{ label() || "Drop image here or click to browse" }}
            </p>
            <p class="upload-hint">{{ hint() }}</p>
          </div>
        </div>
      }

      <!-- Image Preview -->
      @if (uploadedImage()) {
        <div class="image-preview-container">
          <div class="image-preview-wrapper">
            <img
              appMobileOptimized
              [width]="maxWidth()"
              [height]="maxHeight()"
              [lazy]="false"
              [src]="uploadedImage()!.preview"
              [alt]="uploadedImage()!.file.name"
              class="preview-image"
              [style.max-width]="maxWidth() + 'px'"
              [style.max-height]="maxHeight() + 'px'"
            />
            @if (showRemoveButton()) {
              <button
                type="button"
                class="remove-image-btn"
                (click)="removeImage()"
                aria-label="Remove image"
              >
                <i class="pi pi-times" aria-hidden="true"></i>
              </button>
            }
          </div>

          <!-- Image Info -->
          <div class="image-info">
            <span class="image-name">{{ uploadedImage()!.file.name }}</span>
            <span class="image-size">{{
              formatFileSize(uploadedImage()!.file.size)
            }}</span>
            @if (uploadedImage()!.file.width && uploadedImage()!.file.height) {
              <span class="image-dimensions">
                {{ uploadedImage()!.file.width }} ×
                {{ uploadedImage()!.file.height }}
              </span>
            }
          </div>

          <!-- Crop Controls -->
          @if (allowCrop() && uploadedImage()) {
            <div class="crop-controls">
              <app-button size="sm" iconLeft="pi-crop" (clicked)="enableCrop()"
                >Crop Image</app-button
              >
            </div>
          }

          <!-- Resize Controls -->
          @if (allowResize() && uploadedImage()) {
            <div class="resize-controls">
              <label>Width:</label>
              <input
                type="number"
                [value]="resizeWidth()"
                (input)="resizeWidth.set(+$any($event.target).value)"
                [min]="minWidth()"
                [max]="maxWidth()"
              />
              <label>Height:</label>
              <input
                type="number"
                [value]="resizeHeight()"
                (input)="resizeHeight.set(+$any($event.target).value)"
                [min]="minHeight()"
                [max]="maxHeight()"
              />
              <app-button size="sm" (clicked)="resizeImage()"
                >Resize</app-button
              >
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
        <p-message severity="error" styleClass="status-message">
          {{ errorMessage() }}
        </p-message>
      }
    </div>
  `,
  styleUrl: "./image-upload.component.scss",
})
export class ImageUploadComponent {
  fileInput = viewChild<HTMLInputElement>("fileInput");
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

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
          this.maxFileSize(),
        )}`,
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
      (result.file as File & { width?: number; height?: number }).width =
        dimensions.width;
      (result.file as File & { width?: number; height?: number }).height =
        dimensions.height;

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
        error instanceof Error ? error.message : "Failed to process image",
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

      // Simulate upload progress with RxJS timer
      const progressSub = timer(0, 200)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          const current = this.uploadProgress();
          if (current < 90) {
            this.uploadProgress.set(current + 10);
          }
        });

      // Simulate completion
      timer(2000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          progressSub.unsubscribe();
          this.uploadProgress.set(100);
          const url = `https://example.com/uploads/${result.file.name}`;
          result.url = url;
          this.uploadComplete.emit({ file: result.file, url });
        });
    } catch (error) {
      this.uploadProgress.set(0);
      this.errorMessage.set(
        error instanceof Error ? error.message : "Upload failed",
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
    this.logger.debug("Crop functionality not yet implemented");
  }

  resizeImage(): void {
    const width = this.resizeWidth();
    const height = this.resizeHeight();
    const current = this.uploadedImage();

    if (!current) return;

    // Resize functionality would be implemented here
    // Could use canvas API to resize the image
    this.logger.debug(`Resize to ${width}x${height} not yet implemented`);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}
