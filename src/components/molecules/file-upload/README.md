# File Upload Component

A reusable file upload component with drag-and-drop, progress tracking, and validation.

## Usage

```html
<div class="file-upload-container">
  <div class="upload-dropzone">
    <input
      type="file"
      id="file-input"
      multiple
      accept="*/*"
      class="file-input-hidden"
    />
    <div class="upload-content">
      <div class="upload-placeholder">
        <i data-lucide="upload-cloud" style="width: 48px; height: 48px;"></i>
        <p class="upload-label">Drop files here or click to browse</p>
        <p class="upload-hint">Supported formats: PDF, DOC, DOCX, CSV, JSON</p>
      </div>
    </div>
  </div>
</div>
```

## JavaScript Implementation

```javascript
class FileUpload {
  constructor(container) {
    this.container = container;
    this.dropzone = container.querySelector(".upload-dropzone");
    this.fileInput = container.querySelector("#file-input");
    this.init();
  }

  init() {
    this.dropzone.addEventListener("click", () => this.fileInput.click());
    this.dropzone.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.dropzone.addEventListener("dragleave", (e) => this.handleDragLeave(e));
    this.dropzone.addEventListener("drop", (e) => this.handleDrop(e));
    this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
  }

  handleDragOver(e) {
    e.preventDefault();
    this.dropzone.setAttribute("data-drag-over", "true");
  }

  handleDragLeave(e) {
    e.preventDefault();
    this.dropzone.setAttribute("data-drag-over", "false");
  }

  handleDrop(e) {
    e.preventDefault();
    this.dropzone.setAttribute("data-drag-over", "false");
    const files = e.dataTransfer.files;
    this.processFiles(Array.from(files));
  }

  handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  processFiles(files) {
    // Process and validate files
    console.log("Files selected:", files);
  }
}
```

## CSS Classes

- `.file-upload-container` - Main container
- `.upload-dropzone` - Drop zone area
- `.upload-content` - Content wrapper
- `.upload-placeholder` - Placeholder content
- `.upload-label` - Label text
- `.upload-hint` - Hint text
- `.upload-progress` - Progress container
- `.upload-error` - Error message container
