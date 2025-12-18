import {
  Component,
  input,
  output,
  signal,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { MessageModule } from "primeng/message";
import { FileUploadModule } from "primeng/fileupload";
import { HttpClient } from "@angular/common/http";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonModule,
    ProgressBarModule,
    MessageModule,
    FileUploadModule,
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
        (click)="triggerFileInput()">
        <input
          #fileInput
          type="file"
          [multiple]="multiple()"
          [accept]="acceptedTypes()"
          [disabled]="disabled()"
          (change)="onFileSelected($event)"
          class="file-input-hidden"
          [attr.aria-label]="label() || 'File upload'" />

        <div class="upload-content">
          @if (uploadedFiles().length === 0) {
            <div class="upload-placeholder">
              <i class="pi pi-cloud-upload upload-icon"></i>
              <p class="upload-label">{{ label() || "Drop files here or click to browse" }}</p>
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
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                  </div>
                  @if (showRemoveButton()) {
                    <button
                      type="button"
                      class="remove-file-btn"
                      (click)="removeFile(file)"
                      [attr.aria-label]="'Remove ' + file.name">
                      <i class="pi pi-times"></i>
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
        <p-message severity="error" [text]="errorMessage()!"></p-message>
      }

      <!-- File Preview -->
      @if (showPreview() && previewFiles().length > 0) {
        <div class="file-preview">
          <h4>Preview</h4>
          @for (file of previewFiles(); track file.name) {
            <div class="preview-item">
              @if (isImageFile(file)) {
                <img [src]="file.url" [alt]="file.name" />
              } @else if (isTextFile(file)) {
                <pre>{{ filePreviewContent() }}</pre>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .file-upload-container {
        width: 100%;
      }

      .upload-dropzone {
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

      .upload-dropzone:hover:not(.disabled) {
        border-color: var(--color-brand-primary, #089949);
        background: var(--p-surface-50, #f8faf9);
      }

      .upload-dropzone.drag-over {
        border-color: var(--color-brand-primary, #089949);
        background: var(--p-surface-100, #f0f0f0);
      }

      .upload-dropzone.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .file-input-hidden {
        display: none;
      }

      .upload-content {
        width: 100%;
        text-align: center;
      }

      .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2, 0.5rem);
      }

      .upload-icon {
        font-size: 3rem;
        color: var(--color-brand-primary, #089949);
        margin-bottom: var(--space-2, 0.5rem);
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

      .uploaded-files-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2, 0.5rem);
        text-align: left;
      }

      .uploaded-file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3, 0.75rem);
        background: var(--p-surface-50, #f8faf9);
        border-radius: var(--p-border-radius, 0.5rem);
        border: 1px solid var(--p-surface-border, #dee2e6);
      }

      .file-info {
        display: flex;
        align-items: center;
        gap: var(--space-3, 0.75rem);
        flex: 1;
      }

      .file-icon {
        font-size: 1.5rem;
        color: var(--color-brand-primary, #089949);
      }

      .file-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-1, 0.25rem);
      }

      .file-name {
        font-weight: 500;
        color: var(--text-primary, #1a1a1a);
      }

      .file-size {
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-secondary, #6b7280);
      }

      .remove-file-btn {
        background: transparent;
        border: none;
        color: var(--p-danger-color, #ef4444);
        cursor: pointer;
        padding: var(--space-1, 0.25rem);
        border-radius: var(--p-border-radius, 0.5rem);
        transition: background 0.2s;
      }

      .remove-file-btn:hover {
        background: var(--p-surface-100, #f0f0f0);
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

      .file-preview {
        margin-top: var(--space-4, 1rem);
        padding: var(--space-4, 1rem);
        background: var(--p-surface-50, #f8faf9);
        border-radius: var(--p-border-radius, 0.5rem);
      }

      .file-preview h4 {
        margin: 0 0 var(--space-3, 0.75rem) 0;
        font-size: var(--font-heading-md, 1.25rem);
        color: var(--text-primary, #1a1a1a);
      }

      .preview-item {
        margin-top: var(--space-3, 0.75rem);
      }

      .preview-item img {
        max-width: 100%;
        height: auto;
        border-radius: var(--p-border-radius, 0.5rem);
      }

      .preview-item pre {
        background: var(--p-surface-0, #ffffff);
        padding: var(--space-3, 0.75rem);
        border-radius: var(--p-border-radius, 0.5rem);
        overflow-x: auto;
        font-size: var(--font-body-sm, 0.875rem);
      }
    `,
  ],
})
export class FileUploadComponent {
  private http = inject(HttpClient);

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
      ".file-input-hidden"
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
            this.maxFileSize()
          )}`
        );
        continue;
      }

      // Validate file type
      if (
        this.acceptedTypes() !== "*/*" &&
        !this.isFileTypeAccepted(file)
      ) {
        this.errorMessage.set(
          `File "${file.name}" is not an accepted file type`
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
        this.previewFiles(validFiles);
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

  private async previewFiles(files: UploadedFile[]): Promise<void> {
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
        const urls = files.map(
          (f) => `https://example.com/uploads/${f.name}`
        );
        files.forEach((f, i) => {
          f.url = urls[i];
        });
        this.uploadComplete.emit({ files, urls });
      }, 2000);
    } catch (error) {
      this.uploadProgress.set(0);
      this.errorMessage.set(
        error instanceof Error ? error.message : "Upload failed"
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
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
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

