import React, { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import VirtualizedList from './VirtualizedList';

/**
 * Advanced data table component with virtualization, sorting, filtering, and selection
 * Enterprise-grade performance for large datasets
 */
const DataTable = memo(({
  data = [],
  columns = [],
  loading = false,
  error = null,
  pagination = null,
  onSort,
  onFilter,
  onSelect,
  selection = 'none', // 'none', 'single', 'multiple'
  selectedRows = [],
  rowHeight = 48,
  height = 400,
  stickyHeader = true,
  resizable = true,
  searchable = true,
  exportable = false,
  className = '',
  rowClassName,
  onRowClick,
  onRowDoubleClick,
  ...props
}) => {
  const [sortConfig, setSortConfig] = useState(null);
  const [filterConfig, setFilterConfig] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [columnWidths, setColumnWidths] = useState({});
  const [selectedRowIds, setSelectedRowIds] = useState(new Set(selectedRows));
  const tableRef = useRef(null);

  // Process data with sorting, filtering, and searching
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row =>
        columns.some(column => {
          const value = row[column.key]?.toString().toLowerCase() || '';
          return value.includes(query);
        })
      );
    }

    // Apply column filters
    Object.entries(filterConfig).forEach(([columnKey, filterValue]) => {
      if (filterValue && filterValue !== '') {
        result = result.filter(row => {
          const cellValue = row[columnKey]?.toString().toLowerCase() || '';
          const filter = filterValue.toLowerCase();
          return cellValue.includes(filter);
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === bValue) return 0;
        
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, columns, searchQuery, filterConfig, sortConfig]);

  // Handle sorting
  const handleSort = useCallback((columnKey) => {
    const newSortConfig = {
      key: columnKey,
      direction: sortConfig?.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    };
    setSortConfig(newSortConfig);
    onSort?.(newSortConfig);
  }, [sortConfig, onSort]);

  // Handle filtering
  const handleFilter = useCallback((columnKey, value) => {
    const newFilterConfig = {
      ...filterConfig,
      [columnKey]: value
    };
    setFilterConfig(newFilterConfig);
    onFilter?.(newFilterConfig);
  }, [filterConfig, onFilter]);

  // Handle row selection
  const handleRowSelect = useCallback((rowId, selected) => {
    const newSelection = new Set(selectedRowIds);
    
    if (selection === 'single') {
      newSelection.clear();
      if (selected) {
        newSelection.add(rowId);
      }
    } else if (selection === 'multiple') {
      if (selected) {
        newSelection.add(rowId);
      } else {
        newSelection.delete(rowId);
      }
    }
    
    setSelectedRowIds(newSelection);
    onSelect?.(Array.from(newSelection));
  }, [selectedRowIds, selection, onSelect]);

  // Handle select all
  const handleSelectAll = useCallback((selected) => {
    if (selection === 'multiple') {
      const newSelection = selected ? new Set(processedData.map((row, index) => row.id || index)) : new Set();
      setSelectedRowIds(newSelection);
      onSelect?.(Array.from(newSelection));
    }
  }, [selection, processedData, onSelect]);

  // Column resize handler
  const handleColumnResize = useCallback((columnKey, width) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: width
    }));
  }, []);

  // Export functionality
  const handleExport = useCallback(() => {
    const csv = [
      columns.map(col => col.title).join(','),
      ...processedData.map(row => 
        columns.map(col => `"${row[col.key] || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, processedData]);

  // Render table header
  const renderHeader = useCallback(() => (
    <div
      className={`data-table-header ${stickyHeader ? 'sticky' : ''}`}
      style={{
        display: 'flex',
        background: '#f8f9fa',
        borderBottom: '2px solid #dee2e6',
        position: stickyHeader ? 'sticky' : 'relative',
        top: 0,
        zIndex: 10,
        height: rowHeight
      }}
    >
      {/* Selection column */}
      {selection !== 'none' && (
        <div
          className="data-table-cell data-table-header-cell"
          style={{ width: 48, minWidth: 48, padding: '0 12px' }}
        >
          {selection === 'multiple' && (
            <input
              type="checkbox"
              checked={selectedRowIds.size === processedData.length && processedData.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
          )}
        </div>
      )}
      
      {/* Column headers */}
      {columns.map((column) => {
        const width = columnWidths[column.key] || column.width || 150;
        const isSorted = sortConfig?.key === column.key;
        
        return (
          <div
            key={column.key}
            className={`data-table-cell data-table-header-cell ${column.sortable ? 'sortable' : ''} ${isSorted ? 'sorted' : ''}`}
            style={{
              width,
              minWidth: column.minWidth || 100,
              padding: '0 12px',
              cursor: column.sortable ? 'pointer' : 'default',
              position: 'relative'
            }}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <span>{column.title}</span>
              {column.sortable && (
                <span className="sort-indicator" style={{ marginLeft: '8px' }}>
                  {!isSorted && '↕️'}
                  {isSorted && sortConfig.direction === 'asc' && '↑'}
                  {isSorted && sortConfig.direction === 'desc' && '↓'}
                </span>
              )}
            </div>
            
            {/* Column filter */}
            {column.filterable && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20 }}>
                <input
                  type="text"
                  placeholder={`Filter ${column.title}...`}
                  value={filterConfig[column.key] || ''}
                  onChange={(e) => handleFilter(column.key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: '1px solid #ccc',
                    fontSize: '12px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            {/* Resize handle */}
            {resizable && (
              <div
                className="resize-handle"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  cursor: 'col-resize',
                  background: 'transparent'
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startWidth = width;
                  
                  const handleMouseMove = (e) => {
                    const newWidth = Math.max(column.minWidth || 100, startWidth + e.clientX - startX);
                    handleColumnResize(column.key, newWidth);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  ), [
    columns, sortConfig, filterConfig, selectedRowIds, processedData.length,
    selection, stickyHeader, rowHeight, columnWidths, resizable,
    handleSort, handleFilter, handleSelectAll, handleColumnResize
  ]);

  // Render table row
  const renderRow = useCallback((rowData, rowIndex) => {
    const rowId = rowData.id || rowIndex;
    const isSelected = selectedRowIds.has(rowId);
    const rowClasses = [
      'data-table-row',
      isSelected ? 'selected' : '',
      typeof rowClassName === 'function' ? rowClassName(rowData, rowIndex) : rowClassName
    ].filter(Boolean).join(' ');

    return (
      <div
        className={rowClasses}
        style={{
          display: 'flex',
          borderBottom: '1px solid #dee2e6',
          background: isSelected ? '#e3f2fd' : rowIndex % 2 === 0 ? '#fff' : '#f8f9fa',
          cursor: onRowClick ? 'pointer' : 'default'
        }}
        onClick={() => onRowClick?.(rowData, rowIndex)}
        onDoubleClick={() => onRowDoubleClick?.(rowData, rowIndex)}
      >
        {/* Selection cell */}
        {selection !== 'none' && (
          <div
            className="data-table-cell"
            style={{ width: 48, minWidth: 48, padding: '0 12px' }}
          >
            <input
              type={selection === 'single' ? 'radio' : 'checkbox'}
              checked={isSelected}
              onChange={(e) => handleRowSelect(rowId, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        
        {/* Data cells */}
        {columns.map((column) => {
          const width = columnWidths[column.key] || column.width || 150;
          const cellValue = rowData[column.key];
          
          return (
            <div
              key={column.key}
              className="data-table-cell"
              style={{
                width,
                minWidth: column.minWidth || 100,
                padding: '0 12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={cellValue?.toString()}
            >
              {column.render ? column.render(cellValue, rowData, rowIndex) : cellValue}
            </div>
          );
        })}
      </div>
    );
  }, [
    columns, selectedRowIds, selection, columnWidths, rowClassName,
    onRowClick, onRowDoubleClick, handleRowSelect
  ]);

  return (
    <div className={`data-table ${className}`} ref={tableRef} {...props}>
      {/* Table controls */}
      <div className="data-table-controls" style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        {searchable && (
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              minWidth: '200px'
            }}
          />
        )}
        
        {exportable && (
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Export CSV
          </button>
        )}
        
        <div style={{ marginLeft: 'auto' }}>
          {processedData.length} of {data.length} rows
          {selectedRowIds.size > 0 && ` (${selectedRowIds.size} selected)`}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div>Loading...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>
          <div>Error: {error.message || 'Failed to load data'}</div>
        </div>
      )}

      {/* Table content */}
      {!loading && !error && (
        <div className="data-table-container" style={{ border: '1px solid #dee2e6', borderRadius: '4px' }}>
          {renderHeader()}
          
          {processedData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
              No data available
            </div>
          ) : (
            <VirtualizedList
              items={processedData}
              itemHeight={rowHeight}
              containerHeight={height - rowHeight}
              renderItem={renderRow}
              getItemKey={(item, index) => item.id || index}
            />
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="data-table-pagination" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          {pagination}
        </div>
      )}
    </div>
  );
});

DataTable.displayName = 'DataTable';

DataTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    width: PropTypes.number,
    minWidth: PropTypes.number,
    sortable: PropTypes.bool,
    filterable: PropTypes.bool,
    render: PropTypes.func
  })).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.object,
  pagination: PropTypes.node,
  onSort: PropTypes.func,
  onFilter: PropTypes.func,
  onSelect: PropTypes.func,
  selection: PropTypes.oneOf(['none', 'single', 'multiple']),
  selectedRows: PropTypes.array,
  rowHeight: PropTypes.number,
  height: PropTypes.number,
  stickyHeader: PropTypes.bool,
  resizable: PropTypes.bool,
  searchable: PropTypes.bool,
  exportable: PropTypes.bool,
  className: PropTypes.string,
  rowClassName: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  onRowClick: PropTypes.func,
  onRowDoubleClick: PropTypes.func
};

export default DataTable;