import {
  Component,
  input,
  output,
  signal,
  inject,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../button/button.component";
import { ProgressBar } from "primeng/progressbar";
import { Message } from "primeng/message";
import { FileUpload } from "primeng/fileupload";
import { HttpClient } from "@angular/common/http";
import { timer } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MobileOptimizedImageDirective } from "../../directives/mobile-optimized-image.directive";

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
  url?: string;
}

/**
 * File Upload Component - Angular 19+
 *
 * A reusable file upload component with drag-and-drop, progress tracking, and validation
 * Uses Angular signals for reactive state management
 */
@Component({
  selector: "app-file-upload",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ProgressBar,
    Message,
    FileUpload,
    MobileOptimizedImageDirective,
    ButtonComponent,
  ],
  template: `
    <div [class]="containerClass()">
      <!-- Drop Zone -->
      <div
        class="upload-dropzone"
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
          [multiple]="multiple()"
          [accept]="acceptedTypes()"
          [disabled]="disabled()"
          (change)="onFileSelected($event)"
          class="file-input-hidden"
          [attr.aria-label]="label() || 'File upload'"
        />

        <div class="upload-content">
          @if (uploadedFiles().length === 0) {
            <div class="upload-placeholder">
              <i class="pi pi-cloud-upload upload-icon"></i>
              <p class="upload-label">
                {{ label() || "Drop files here or click to browse" }}
              </p>
              <p class="upload-hint">{{ hint() }}</p>
            </div>
          } @else {
            <div class="uploaded-files-list">
              @for (file of uploadedFiles(); track file.name) {
                <div class="uploaded-file-item">
                  <div class="file-info">
                    <i class="pi pi-file file-icon"></i>
                    <div class="file-details">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{
                        formatFileSize(file.size)
                      }}</span>
                    </div>
                  </div>
                  @if (showRemoveButton()) {
                    <button
                      type="button"
                      class="remove-file-btn"
                      (click)="removeFile(file)"
                      [attr.aria-label]="'Remove ' + file.name"
                    >
                      <i class="pi pi-times" aria-hidden="true"></i>
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Progress Bar -->
      @if (uploadProgress() > 0 && uploadProgress() < 100) {
        <div class="upload-progress">
          <p-progressBar [value]="uploadProgress()"></p-progressBar>
          <span class="progress-text">{{ uploadProgress() }}%</span>
        </div>
      }

      <!-- Error Message -->
      @if (errorMessage()) {
        <p-message severity="error" class="status-message">
          {{ errorMessage() }}
        </p-message>
      }

      <!-- File Preview -->
      @if (showPreview() && previewFiles().length > 0) {
        <div class="file-preview">
          <h4>Preview</h4>
          @for (file of previewFiles(); track file.name) {
            <div class="preview-item">
              @if (isImageFile(file)) {
                <img
                  appMobileOptimized
                  [width]="200"
                  [height]="200"
                  [src]="file.url"
                  [alt]="file.name"
                />
              } @else if (isTextFile(file)) {
                <pre>{{ filePreviewContent() }}</pre>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: "./file-upload.component.scss",
})
export class FileUploadComponent {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  // Configuration
  label = input<string>("Drop files here or click to browse");
  hint = input<string>("Supported formats: PDF, DOC, DOCX, CSV, JSON");
  multiple = input<boolean>(false);
  acceptedTypes = input<string>("*/*");
  maxFileSize = input<number>(10 * 1024 * 1024); // 10MB default
  uploadUrl = input<string>();
  showRemoveButton = input<boolean>(true);
  showPreview = input<boolean>(false);
  disabled = input<boolean>(false);

  // State
  uploadedFiles = signal<UploadedFile[]>([]);
  uploadProgress = signal<number>(0);
  errorMessage = signal<string | null>(null);
  isDragging = signal<boolean>(false);
  filePreviewContent = signal<string>("");

  // Outputs
  filesSelected = output<UploadedFile[]>();
  filesRemoved = output<UploadedFile[]>();
  uploadComplete = output<{ files: UploadedFile[]; urls: string[] }>();
  uploadError = output<Error>();

  containerClass = () => {
    return "file-upload-container";
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
      this.processFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  triggerFileInput(): void {
    if (this.disabled()) return;
    const fileInput = document.querySelector(
      ".file-input-hidden",
    ) as HTMLInputElement;
    fileInput?.click();
  }

  private processFiles(files: File[]): void {
    this.errorMessage.set(null);
    const validFiles: UploadedFile[] = [];

    for (const file of files) {
      // Validate file size
      if (file.size > this.maxFileSize()) {
        this.errorMessage.set(
          `File "${file.name}" exceeds maximum size of ${this.formatFileSize(
            this.maxFileSize(),
          )}`,
        );
        continue;
      }

      // Validate file type
      if (this.acceptedTypes() !== "*/*" && !this.isFileTypeAccepted(file)) {
        this.errorMessage.set(
          `File "${file.name}" is not an accepted file type`,
        );
        continue;
      }

      validFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      });
    }

    if (validFiles.length > 0) {
      const currentFiles = this.uploadedFiles();
      const newFiles = this.multiple()
        ? [...currentFiles, ...validFiles]
        : validFiles;
      this.uploadedFiles.set(newFiles);
      this.filesSelected.emit(newFiles);

      // Auto-upload if URL provided
      if (this.uploadUrl()) {
        this.uploadFiles(newFiles);
      }

      // Preview text files
      if (this.showPreview()) {
        this.loadFilePreviews(validFiles);
      }
    }
  }

  private isFileTypeAccepted(file: File): boolean {
    const accepted = this.acceptedTypes().split(",");
    return accepted.some((type) => {
      const trimmed = type.trim();
      if (trimmed === "*/*") return true;
      if (trimmed.startsWith(".")) {
        return file.name.toLowerCase().endsWith(trimmed.toLowerCase());
      }
      return file.type.match(trimmed.replace("*", ".*"));
    });
  }

  private async loadFilePreviews(files: UploadedFile[]): Promise<void> {
    const textFiles = files.filter((f) => this.isTextFile(f));
    if (textFiles.length > 0) {
      const content = await textFiles[0].file.text();
      this.filePreviewContent.set(content.substring(0, 1000));
    }
  }

  private async uploadFiles(files: UploadedFile[]): Promise<void> {
    if (!this.uploadUrl()) return;

    this.uploadProgress.set(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file.file);
      });

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
          const urls = files.map(
            (f) => `https://example.com/uploads/${f.name}`,
          );
          files.forEach((f, i) => {
            f.url = urls[i];
          });
          this.uploadComplete.emit({ files, urls });
        });
    } catch (error) {
      this.uploadProgress.set(0);
      this.errorMessage.set(
        error instanceof Error ? error.message : "Upload failed",
      );
      this.uploadError.emit(error as Error);
    }
  }

  removeFile(file: UploadedFile): void {
    const current = this.uploadedFiles();
    const updated = current.filter((f) => f.name !== file.name);
    this.uploadedFiles.set(updated);
    this.filesRemoved.emit([file]);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  isImageFile(file: UploadedFile): boolean {
    return file.type.startsWith("image/");
  }

  isTextFile(file: UploadedFile): boolean {
    return (
      file.type.startsWith("text/") ||
      file.type === "application/json" ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".csv")
    );
  }

  previewFiles = signal<UploadedFile[]>([]);
}
