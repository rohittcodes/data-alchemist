'use client'

import React, { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  CellContext,
} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Edit3, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ValidationError {
  row: number
  column: string
  message: string
}

interface DataTableProps {
  data: Record<string, any>[]
  onCellEdit: (rowIndex: number, columnId: string, value: string) => Promise<void>
  validationErrors?: ValidationError[]
  readOnly?: boolean
  className?: string
}

// Extend TableMeta to include our custom properties
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData> {
    onCellEdit?: (rowIndex: number, columnId: string, value: string) => Promise<void>
    validationErrors?: ValidationError[]
  }
}

// Editable Cell Component
const EditableCell = ({ 
  getValue, 
  row, 
  column, 
  table 
}: CellContext<Record<string, any>, unknown>) => {
  const initialValue = getValue() as string
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const onSave = async () => {
    if (value !== initialValue) {
      setIsSaving(true)
      try {
        const onCellEdit = table.options.meta?.onCellEdit
        if (onCellEdit) {
          await onCellEdit(row.index, column.id, value)
        }
      } catch (error) {
        console.error('Failed to save cell:', error)
        setValue(initialValue) // Revert on error
      }
      setIsSaving(false)
    }
    setIsEditing(false)
  }

  const onCancel = () => {
    setValue(initialValue)
    setIsEditing(false)
  }

  const validationErrors = table.options.meta?.validationErrors || []
  const hasError = validationErrors.some(
    error => error.row === row.index && error.column === column.id
  )
  const errorMessage = validationErrors.find(
    error => error.row === row.index && error.column === column.id
  )?.message

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave()
            if (e.key === 'Escape') onCancel()
          }}
          className={cn(
            "h-8 text-sm",
            hasError && "border-red-500 focus:border-red-500"
          )}
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={onSave}
          disabled={isSaving}
          className="h-8 w-8 p-0"
        >
          {isSaving ? (
            <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          ) : (
            <Check className="h-3 w-3 text-green-600" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "group flex items-center justify-between cursor-pointer rounded px-2 py-1 hover:bg-muted/50",
        hasError && "bg-red-50 border border-red-200"
      )}
      onClick={() => setIsEditing(true)}
      title={hasError ? errorMessage : 'Click to edit'}
    >
      <span className={cn(
        "truncate",
        hasError && "text-red-700"
      )}>
        {value || '-'}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {hasError && <AlertTriangle className="h-3 w-3 text-red-500" />}
        <Edit3 className="h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  )
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  onCellEdit,
  validationErrors = [],
  readOnly = false,
  className
}) => {
  // Generate columns dynamically based on data structure
  const columns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    if (!data || data.length === 0) return []

    const headers = Object.keys(data[0])
    
    return headers.map(header => ({
      accessorKey: header,
      header: () => (
        <div className="font-semibold text-left">
          {header}
        </div>
      ),
      cell: readOnly 
        ? ({ getValue }) => (
            <div className="px-2 py-1">
              {getValue() as string || '-'}
            </div>
          )
        : EditableCell,
      size: 150,
      minSize: 100,
      maxSize: 300,
    }))
  }, [data, readOnly])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onCellEdit,
      validationErrors,
    },
  })

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Error Summary */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertTriangle className="h-4 w-4" />
            {validationErrors.length} validation error{validationErrors.length > 1 ? 's' : ''} found
          </div>
          <div className="text-sm text-red-600 space-y-1">
            {validationErrors.slice(0, 3).map((error, index) => (
              <div key={index}>
                Row {error.row + 1}, {error.column}: {error.message}
              </div>
            ))}
            {validationErrors.length > 3 && (
              <div className="text-red-500">
                +{validationErrors.length - 3} more errors...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left p-3 font-medium border-b"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, index) => (
                <tr 
                  key={row.id}
                  className={cn(
                    "border-b hover:bg-muted/25 transition-colors",
                    index % 2 === 0 ? "bg-background" : "bg-muted/10"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td 
                      key={cell.id} 
                      className="p-1 border-r last:border-r-0"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-sm text-muted-foreground">
        Showing {data.length} rows
        {!readOnly && (
          <span className="ml-4">
            💡 Click any cell to edit
          </span>
        )}
      </div>
    </div>
  )
}