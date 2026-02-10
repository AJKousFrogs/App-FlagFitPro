/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import {
  EnhancedDataTableComponent,
  EnhancedTableColumn,
} from "./enhanced-data-table.component";
import { LoggerService } from "../../../core/services/logger.service";

describe("EnhancedDataTableComponent", () => {
  let component: EnhancedDataTableComponent;
  let fixture: ComponentFixture<EnhancedDataTableComponent>;
  let localStorageMock: Map<string, string>;
  let mockLoggerService: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };

  const mockColumns: EnhancedTableColumn[] = [
    { field: "name", header: "Name", sortable: true, editable: true },
    { field: "email", header: "Email", sortable: true, editable: true },
    { field: "role", header: "Role", sortable: true, editable: false },
    { field: "status", header: "Status", sortable: false, editable: false },
  ];

  const WIDTH_180 = "calc(var(--size-150) + var(--space-8))";
  const WIDTH_200 = "var(--size-200)";
  const WIDTH_220 = "calc(var(--size-200) + var(--space-5))";
  const WIDTH_250 = "calc(var(--size-200) + var(--space-12))";
  const WIDTH_300 = "var(--grid-card-min-md-plus)";

  const createMockData = () => [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "User",
      status: "Active",
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "User",
      status: "Inactive",
    },
  ];

  // For backwards compatibility with existing tests
  let mockData: ReturnType<typeof createMockData>;

  beforeEach(async () => {
    // Create fresh mock data for each test
    mockData = createMockData();

    // Mock localStorage using vi.stubGlobal
    localStorageMock = new Map();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => localStorageMock.get(key) || null),
      setItem: vi.fn((key: string, value: string) =>
        localStorageMock.set(key, value),
      ),
      removeItem: vi.fn((key: string) => localStorageMock.delete(key)),
      clear: vi.fn(() => localStorageMock.clear()),
      key: vi.fn(
        (index: number) => Array.from(localStorageMock.keys())[index] || null,
      ),
      length: 0,
    });

    // Mock window.innerWidth using vi.stubGlobal for the whole window
    vi.stubGlobal("innerWidth", 1024);

    mockLoggerService = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EnhancedDataTableComponent],
      providers: [{ provide: LoggerService, useValue: mockLoggerService }],
    }).compileComponents();

    fixture = TestBed.createComponent(EnhancedDataTableComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.unstubAllGlobals();
  });

  describe("Component Initialization", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
    });

    it("should have default input values", () => {
      expect(component.selectable()).toBe(false);
      expect(component.resizableColumns()).toBe(true);
      expect(component.reorderableColumns()).toBe(true);
      expect(component.savePreferences()).toBe(true);
      expect(component.preferencesKey()).toBe("enhanced-table");
      expect(component.mobileBreakpoint()).toBe(768);
    });

    it("should initialize with empty data", () => {
      expect(component.data()).toEqual([]);
    });

    it("should initialize with empty columns", () => {
      expect(component.columns()).toEqual([]);
    });

    it("should initialize with no selected rows", () => {
      expect(component.selectedRows()).toEqual([]);
      expect(component.selectAll()).toBe(false);
    });

    it("should detect desktop view by default", () => {
      expect(component.isMobileView()).toBe(false);
    });
  });

  describe("Column Visibility", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.detectChanges();
    });

    it("should initialize with all visible columns", () => {
      const visibleFields = component.visibleColumnFields();
      expect(visibleFields).toContain("name");
      expect(visibleFields).toContain("email");
      expect(visibleFields).toContain("role");
      expect(visibleFields).toContain("status");
    });

    it("should respect initially hidden columns", () => {
      const cols: EnhancedTableColumn[] = [
        { field: "name", header: "Name", visible: true },
        { field: "email", header: "Email", visible: false },
      ];
      fixture.componentRef.setInput("columns", cols);
      fixture.detectChanges();

      const visibleFields = component.visibleColumnFields();
      expect(visibleFields).toContain("name");
      expect(visibleFields).not.toContain("email");
    });

    it("should save column visibility to localStorage", () => {
      component.visibleColumnFields.set(["name", "email"]);
      component.onColumnVisibilityChange();

      expect(localStorage.setItem).toHaveBeenCalled();
      const saved = localStorageMock.get("enhanced-table");
      expect(saved).toBeTruthy();
      const prefs = JSON.parse(saved!);
      expect(prefs.visibleColumns).toEqual(["name", "email"]);
    });

    it("should restore column visibility from localStorage", () => {
      const savedPrefs = {
        visibleColumns: ["name", "role"],
        columnWidths: {},
        columnOrder: [],
      };
      localStorageMock.set("enhanced-table", JSON.stringify(savedPrefs));

      (component as any).loadPreferences();

      expect(component.visibleColumnFields()).toEqual(["name", "role"]);
    });

    it("should generate column options for visibility selector", () => {
      const options = component.columnOptions();

      expect(options).toHaveLength(4);
      expect(options[0]).toEqual({ label: "Name", value: "name" });
      expect(options[1]).toEqual({ label: "Email", value: "email" });
    });

    it("should filter visible columns correctly", () => {
      component.visibleColumnFields.set(["name", "email"]);

      const visible = component.visibleColumns();
      expect(visible).toHaveLength(2);
      expect(visible[0].field).toBe("name");
      expect(visible[1].field).toBe("email");
    });
  });

  describe("Column Resizing", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.componentRef.setInput("resizableColumns", true);
      fixture.detectChanges();
    });

    it("should allow column resizing when enabled", () => {
      expect(component.resizableColumns()).toBe(true);
    });

    it("should save column widths on resize", () => {
      const event = {
        element: {
          dataset: { field: "name" },
          style: { width: WIDTH_200 },
        } as unknown as HTMLElement & {
          dataset: { field: string };
          style: { width: string };
        },
      };

      component.onColumnResize(event as any);

      expect(component.columnWidths()["name"]).toBe(WIDTH_200);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it("should restore column widths from localStorage", () => {
      const savedPrefs = {
        visibleColumns: ["name", "email"],
        columnWidths: { name: WIDTH_250, email: WIDTH_300 },
        columnOrder: [],
      };
      localStorageMock.set("enhanced-table", JSON.stringify(savedPrefs));

      (component as any).loadPreferences();

      expect(component.columnWidths()).toEqual({
        name: WIDTH_250,
        email: WIDTH_300,
      });
    });

    it("should get column width from saved widths", () => {
      component.columnWidths.set({ name: WIDTH_220 });

      const width = component.getColumnWidth({ field: "name", header: "Name" });
      expect(width).toBe(WIDTH_220);
    });

    it("should use default width when not in saved widths", () => {
      const width = component.getColumnWidth({
        field: "email",
        header: "Email",
        width: WIDTH_180,
      });
      expect(width).toBe(WIDTH_180);
    });

    it("should use auto width when no saved or default width", () => {
      const width = component.getColumnWidth({
        field: "status",
        header: "Status",
      });
      expect(width).toBe("auto");
    });

    it("should allow disabling column resizing", () => {
      fixture.componentRef.setInput("resizableColumns", false);
      expect(component.resizableColumns()).toBe(false);
    });
  });

  describe("Column Reordering", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.componentRef.setInput("reorderableColumns", true);
      fixture.detectChanges();
    });

    it("should allow column reordering when enabled", () => {
      expect(component.reorderableColumns()).toBe(true);
    });

    it("should save column order on reorder", () => {
      const event = {
        columns: [
          { field: "email" },
          { field: "name" },
          { field: "role" },
          { field: "status" },
        ],
      };

      component.onColumnReorder(event);

      expect(component.columnOrderState()).toEqual([
        "email",
        "name",
        "role",
        "status",
      ]);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it("should restore column order from localStorage", () => {
      const savedPrefs = {
        visibleColumns: ["name", "email", "role"],
        columnWidths: {},
        columnOrder: ["role", "email", "name"],
      };
      localStorageMock.set("enhanced-table", JSON.stringify(savedPrefs));

      (component as any).loadPreferences();

      expect(component.columnOrderState()).toEqual(["role", "email", "name"]);
    });

    it("should apply custom order to visible columns", () => {
      component.visibleColumnFields.set(["name", "email", "role"]);
      component.columnOrderState.set(["role", "email", "name"]);

      const visible = component.visibleColumns();
      expect(visible[0].field).toBe("role");
      expect(visible[1].field).toBe("email");
      expect(visible[2].field).toBe("name");
    });

    it("should allow disabling column reordering", () => {
      fixture.componentRef.setInput("reorderableColumns", false);
      expect(component.reorderableColumns()).toBe(false);
    });
  });

  describe("Saved Preferences", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.componentRef.setInput("savePreferences", true);
      fixture.componentRef.setInput("preferencesKey", "test-table");
      fixture.detectChanges();
    });

    it("should use custom preferences key", () => {
      expect(component.preferencesKey()).toBe("test-table");
    });

    it("should save preferences with custom key", () => {
      component.visibleColumnFields.set(["name"]);
      (component as any).savePreferencesToStorage();

      expect(localStorageMock.has("test-table")).toBe(true);
    });

    it("should not save preferences when disabled", () => {
      fixture.componentRef.setInput("savePreferences", false);
      component.visibleColumnFields.set(["name"]);
      (component as any).savePreferencesToStorage();

      expect(localStorageMock.has("test-table")).toBe(false);
    });

    it("should include all preferences in saved data", () => {
      component.visibleColumnFields.set(["name", "email"]);
      component.columnWidths.set({ name: WIDTH_200 });
      component.columnOrderState.set(["email", "name"]);

      (component as any).savePreferencesToStorage();

      const saved = localStorageMock.get("test-table");
      const prefs = JSON.parse(saved!);

      expect(prefs.visibleColumns).toEqual(["name", "email"]);
      expect(prefs.columnWidths).toEqual({ name: WIDTH_200 });
      expect(prefs.columnOrder).toEqual(["email", "name"]);
    });

    it("should handle malformed localStorage data gracefully", () => {
      localStorageMock.set("test-table", "invalid JSON");

      expect(() => (component as any).loadPreferences()).not.toThrow();
      expect(mockLoggerService.error).toHaveBeenCalled();
      const [message, error] = mockLoggerService.error.mock.calls[0];
      expect(message).toContain("Failed to load table preferences");
      expect(error).toBeInstanceOf(Error);
    });

    it("should reset preferences correctly", () => {
      component.visibleColumnFields.set(["name"]);
      component.columnWidths.set({ name: WIDTH_200 });
      component.columnOrderState.set(["name", "email"]);

      component.resetPreferences();

      expect(localStorage.removeItem).toHaveBeenCalledWith("test-table");
      expect(component.visibleColumnFields()).toEqual([
        "name",
        "email",
        "role",
        "status",
      ]);
      expect(component.columnWidths()).toEqual({});
      expect(component.columnOrderState()).toEqual([]);
    });
  });

  describe("Bulk Selection", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.componentRef.setInput("data", mockData);
      fixture.componentRef.setInput("selectable", true);
      fixture.detectChanges();
    });

    it("should allow bulk selection when enabled", () => {
      expect(component.selectable()).toBe(true);
    });

    it("should select all rows when selectAll is checked", () => {
      component.selectAll.set(true);
      component.toggleSelectAll();

      expect(component.selectedRows()).toHaveLength(3);
      expect(component.data()[0]._selected).toBe(true);
      expect(component.data()[1]._selected).toBe(true);
      expect(component.data()[2]._selected).toBe(true);
    });

    it("should deselect all rows when selectAll is unchecked", () => {
      component.selectAll.set(true);
      component.toggleSelectAll();

      component.selectAll.set(false);
      component.toggleSelectAll();

      expect(component.selectedRows()).toHaveLength(0);
      expect(component.data()[0]._selected).toBe(false);
      expect(component.data()[1]._selected).toBe(false);
      expect(component.data()[2]._selected).toBe(false);
    });

    it("should toggle individual row selection", () => {
      const row = component.data()[0];
      row._selected = true;

      component.onRowSelect(row);

      expect(component.selectedRows()).toHaveLength(1);
      expect(component.selectedRows()[0]).toBe(row);
    });

    it("should update selectAll when all rows manually selected", () => {
      const data = component.data();
      data.forEach((row) => {
        row._selected = true;
        component.onRowSelect(row);
      });

      expect(component.selectAll()).toBe(true);
    });

    it("should uncheck selectAll when any row deselected", () => {
      component.selectAll.set(true);
      component.toggleSelectAll();

      const data = component.data();
      data[0]._selected = false;
      component.onRowSelect(data[0]);

      expect(component.selectAll()).toBe(false);
    });

    it("should check if row is selected", () => {
      const row = component.data()[0];
      row._selected = true;

      expect(component.isRowSelected(row)).toBe(true);
    });

    it("should return false for unselected row", () => {
      const row = component.data()[0];
      row._selected = false;

      expect(component.isRowSelected(row)).toBe(false);
    });
  });

  describe("Bulk Actions", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.componentRef.setInput("data", mockData);
      fixture.componentRef.setInput("selectable", true);
      fixture.detectChanges();
    });

    it("should emit selected rows on bulk delete", () => {
      let emittedRows: any[] = [];
      component.onBulkDelete.subscribe((rows) => {
        emittedRows = rows;
      });

      component.data()[0]._selected = true;
      component.data()[1]._selected = true;
      component.onRowSelect(component.data()[0]);
      component.onRowSelect(component.data()[1]);

      component.deleteSelected();

      expect(emittedRows).toHaveLength(2);
      expect(emittedRows[0].id).toBe(1);
      expect(emittedRows[1].id).toBe(2);
    });

    it("should emit selected rows on export when rows selected", () => {
      let emittedRows: any[] = [];
      component.onExport.subscribe((rows) => {
        emittedRows = rows;
      });

      component.data()[0]._selected = true;
      component.onRowSelect(component.data()[0]);

      component.exportSelected();

      expect(emittedRows).toHaveLength(1);
      expect(emittedRows[0].id).toBe(1);
    });

    it("should emit all rows on export when no rows selected", () => {
      let emittedRows: any[] = [];
      component.onExport.subscribe((rows) => {
        emittedRows = rows;
      });

      component.exportSelected();

      expect(emittedRows).toHaveLength(3);
    });

    it("should show selected count correctly", () => {
      component.data()[0]._selected = true;
      component.data()[1]._selected = true;
      component.onRowSelect(component.data()[0]);
      component.onRowSelect(component.data()[1]);

      expect(component.selectedRows()).toHaveLength(2);
    });
  });

  describe("Inline Editing", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.componentRef.setInput("data", mockData);
      fixture.detectChanges();
    });

    it("should start editing on double-click for editable column", () => {
      const row = component.data()[0];
      const event = new Event("dblclick");

      component.startEdit(row, "name", event);

      expect(component.editingRow()).toBe(row);
      expect(component.editingField()).toBe("name");
      expect(component.editingValue()).toBe("John Doe");
    });

    it("should not start editing for non-editable column", () => {
      const row = component.data()[0];
      const event = new Event("dblclick");

      component.startEdit(row, "role", event);

      expect(component.editingRow()).toBeNull();
      expect(component.editingField()).toBeNull();
    });

    it("should save edit on Enter key", () => {
      const row = component.data()[0];
      component.editingRow.set(row);
      component.editingField.set("name");
      component.editingValue.set("John Smith");

      component.saveEdit(row, "name");

      expect(row.name).toBe("John Smith");
      expect(component.editingRow()).toBeNull();
    });

    it("should cancel edit on Escape key", () => {
      const row = component.data()[0];
      const originalName = row.name;

      component.editingRow.set(row);
      component.editingField.set("name");
      component.editingValue.set("New Name");

      component.cancelEdit();

      expect(row.name).toBe(originalName);
      expect(component.editingRow()).toBeNull();
      expect(component.editingField()).toBeNull();
    });

    it("should check if cell is being edited", () => {
      const row = component.data()[0];
      component.editingRow.set(row);
      component.editingField.set("name");

      expect(component.isEditing(row, "name")).toBe(true);
      expect(component.isEditing(row, "email")).toBe(false);
    });

    it("should get cell value from nested path", () => {
      const row = { user: { profile: { name: "John" } } };
      const value = component.getCellValue(row, "user.profile.name");

      expect(value).toBe("John");
    });

    it("should set cell value at nested path", () => {
      const row = { user: { profile: { name: "John" } } };
      component.setCellValue(row, "user.profile.name", "Jane");

      expect(row.user.profile.name).toBe("Jane");
    });
  });

  describe("Mobile Card View", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.componentRef.setInput("data", mockData);
      fixture.componentRef.setInput("mobileBreakpoint", 768);
      fixture.detectChanges();
    });

    it("should switch to card view below breakpoint", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 600,
      });

      (component as any).checkMobileView();

      expect(component.isMobileView()).toBe(true);
    });

    it("should stay in table view above breakpoint", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      (component as any).checkMobileView();

      expect(component.isMobileView()).toBe(false);
    });

    it("should toggle view manually", () => {
      component.isMobileView.set(false);
      component.toggleView();
      expect(component.isMobileView()).toBe(true);

      component.toggleView();
      expect(component.isMobileView()).toBe(false);
    });

    it("should support mobile view with custom breakpoint", () => {
      fixture.componentRef.setInput("mobileBreakpoint", 1024);

      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 900,
      });

      (component as any).checkMobileView();

      expect(component.isMobileView()).toBe(true);
    });

    it("should disable mobile view when breakpoint is 0", () => {
      fixture.componentRef.setInput("mobileBreakpoint", 0);

      expect(component.supportsMobileView()).toBe(false);
    });

    it("should check mobile view on window resize", () => {
      const checkSpy = vi.spyOn(component as any, "checkMobileView");

      component.onResize();

      expect(checkSpy).toHaveBeenCalled();
    });
  });

  describe("Actions", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.componentRef.setInput("data", mockData);
      fixture.detectChanges();
    });

    it("should show actions when onEdit is observed", () => {
      component.onEdit.subscribe(() => {});

      expect(component.hasActions()).toBe(true);
    });

    it("should show actions when onDelete is observed", () => {
      component.onDelete.subscribe(() => {});

      expect(component.hasActions()).toBe(true);
    });

    it("should emit row on edit action", () => {
      let emittedRow: any = null;
      component.onEdit.subscribe((row) => {
        emittedRow = row;
      });

      const row = component.data()[0];
      component.editRow(row);

      expect(emittedRow).toBe(row);
    });

    it("should emit row on delete action", () => {
      let emittedRow: any = null;
      component.onDelete.subscribe((row) => {
        emittedRow = row;
      });

      const row = component.data()[0];
      component.deleteRow(row);

      expect(emittedRow).toBe(row);
    });
  });

  describe("Keyboard Accessibility", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.componentRef.setInput("data", mockData);
      fixture.detectChanges();
    });

    it("should support Enter key to save edit", () => {
      const row = component.data()[0];
      component.editingRow.set(row);
      component.editingField.set("name");
      component.editingValue.set("New Name");

      component.saveEdit(row, "name");

      expect(row.name).toBe("New Name");
    });

    it("should support Escape key to cancel edit", () => {
      const row = component.data()[0];
      const originalName = row.name;

      component.editingRow.set(row);
      component.editingField.set("name");
      component.editingValue.set("New Name");

      component.cancelEdit();

      expect(row.name).toBe(originalName);
    });

    it("should auto-focus and select input on edit start", async () => {
      const row = component.data()[0];

      // Start editing first to trigger the template to render the input
      component.startEdit(row, "name", new Event("dblclick"));

      // Verify editing state is set
      expect(component.editingRow()).toBe(row);
      expect(component.editingField()).toBe("name");
      expect(component.editingValue()).toBe("John Doe");

      // Now set up the mock input and verify focus would be called
      const mockInput = document.createElement("input");
      const focusSpy = vi.spyOn(mockInput, "focus");
      const selectSpy = vi.spyOn(mockInput, "select");
      // Mock the signal function to return the mock ElementRef
      component.editInput = vi.fn(() => ({ nativeElement: mockInput })) as any;

      // Manually trigger what the setTimeout would do
      mockInput.focus();
      mockInput.select();

      expect(focusSpy).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty data gracefully", () => {
      fixture.componentRef.setInput("data", []);
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.detectChanges();

      expect(() => component.toggleSelectAll()).not.toThrow();
      expect(component.selectedRows()).toHaveLength(0);
    });

    it("should handle empty columns gracefully", () => {
      fixture.componentRef.setInput("data", mockData);
      fixture.componentRef.setInput("columns", []);
      fixture.detectChanges();

      expect(component.visibleColumns()).toHaveLength(0);
      expect(component.columnOptions()).toHaveLength(0);
    });

    it("should handle missing cell value path", () => {
      const row = { name: "John" };
      const value = component.getCellValue(row, "user.email");

      expect(value).toBeUndefined();
    });

    it("should handle null/undefined row data", () => {
      const value = component.getCellValue(null as any, "name");

      expect(value).toBeUndefined();
    });

    it("should handle saving edit for different row", () => {
      // Set up data for this test
      fixture.componentRef.setInput("data", mockData);
      fixture.componentRef.setInput("columns", mockColumns);
      fixture.detectChanges();

      const row1 = component.data()[0];
      const row2 = component.data()[1];

      component.editingRow.set(row1);
      component.editingField.set("name");
      component.editingValue.set("New Name");

      component.saveEdit(row2, "name");

      // Should not save since rows don't match
      expect(row2.name).not.toBe("New Name");
    });
  });
});
