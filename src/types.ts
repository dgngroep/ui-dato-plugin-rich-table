import {
  isCellValue,
  type ButtonCellValue,
  type CellValue,
  type DastCellValue,
  type ImageCellValue,
} from './utils/dastConverter';

export type { ButtonCellValue, CellValue, DastCellValue, ImageCellValue };

export type Value = {
  columns: string[];
  columnLabels?: Record<string, string>;
  data: Row[];
};

export type Row = Record<string, CellValue>;

export type Data = Row[];

export type Actions = {
  onCellUpdate: (index: number, column: string, value: CellValue) => void;
  onMultipleCellUpdate: (
    index: number,
    column: string,
    value: string[][],
  ) => void;
  onAddColumn: (column: string, toTheLeft: boolean) => void;
  onMoveColumn: (column: string, toTheLeft: boolean) => void;
  onRemoveColumn: (column: string) => void;
  onColumnRename: (column: string, newColumn: string) => void;
  onAddRow: (row: number, toTheBottom: boolean) => void;
  onMoveRow: (row: number, toTheBottom: boolean) => void;
  onRemoveRow: (row: number) => void;
};

const isObject = (data: unknown): data is Record<string, unknown> => {
  return typeof data === 'object' && !Array.isArray(data) && data !== null;
};

const isRow = (data: unknown): data is Row => {
  return isObject(data) && Object.values(data).every(isCellValue);
};

const isColumns = (data: unknown): data is string[] => {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;
  return data.every((column) => typeof column === 'string');
};

const isData = (data: unknown, columns: string[]): data is Data => {
  if (!Array.isArray(data)) return false;
  const sortedColumns = [...columns].sort();
  return data.every(
    (row) =>
      isRow(row) &&
      JSON.stringify(Object.keys(row).sort()) ===
        JSON.stringify(sortedColumns),
  );
};

export const isValue = (data: unknown): data is Value => {
  if (!isObject(data)) return false;
  const columns = data.columns;
  const rows = data.data;
  return isColumns(columns) && isData(rows, columns);
};
