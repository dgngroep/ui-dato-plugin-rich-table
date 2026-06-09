import {
  faExpand,
  faLongArrowAltDown,
  faLongArrowAltUp,
  faPlus,
  faTrash,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownOption,
  DropdownSeparator,
  useCtx,
} from "datocms-react-ui";
import omit from "lodash-es/omit";
import { useEffect, useMemo, useRef } from "react";
import {
  type Column,
  type ColumnInstance,
  type TableOptions,
  useFlexLayout,
  useResizeColumns,
  useTable,
} from "react-table";
import { useDeepCompareMemo } from "use-deep-compare";
import type { Actions, Row, Value } from "../../types";
import { emptyCell, stringToCellValue } from "../../utils/dastConverter";
import Cell from "../Cell";
import EditableHeader from "../EditableHeader";
import s from "./styles.module.css";

// react-table 7 augments ColumnInstance with resize props via UseResizeColumns plugin
type ResizableColumn = ColumnInstance<Row> & {
  getResizerProps: () => Record<string, unknown>;
  isResizing: boolean;
};

type Props = {
  value: Value;
  onChange: (value: Value | null) => void;
  onOpenInFullScreen?: () => void;
};

function orderedKeys<T extends { [k: string]: unknown }>(
  object: T,
  columns: string[],
): T {
  return Object.fromEntries(
    Object.entries(object).sort(
      ([key1], [key2]) => columns.indexOf(key1) - columns.indexOf(key2),
    ),
  ) as T;
}

function moveItemInArray<T>(
  arr: T[],
  fromIndex: number,
  toTheLeft: boolean,
): T[] {
  const newArray = [...arr];
  const toIndex = toTheLeft ? fromIndex - 1 : fromIndex + 1;
  const element = newArray[fromIndex];
  newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, element);
  return newArray;
}

export default function TableEditor({
  value,
  onChange,
  onOpenInFullScreen,
}: Props) {
  const ctx = useCtx();

  const defaultColumn = useMemo(
    () => ({
      minWidth: 30,
      width: 150,
      maxWidth: 400,
    }),
    [],
  );

  // Cast to unknown first to satisfy react-table 7's strict Column type —
  // our accessor returns CellValue (object) instead of string, which is fine at runtime.
  const tableColumns = useDeepCompareMemo<Column<Row>[]>(
    () =>
      value.columns.map((column) => ({
        Header: EditableHeader,
        Cell,
        id: column,
        accessor: (row: Row) => row[column],
      })) as unknown as Column<Row>[],
    [value.columns],
  );

  const onCellUpdate: Actions["onCellUpdate"] = (index, column, cellValue) => {
    onChange({
      ...value,
      data: value.data.map((row, i) =>
        i !== index
          ? row
          : orderedKeys({ ...row, [column]: cellValue }, value.columns),
      ),
    });
  };

  const onColumnRename: Actions["onColumnRename"] = (column, newLabel) => {
    onChange({
      ...value,
      columnLabels: { ...value.columnLabels, [column]: newLabel },
    });
  };

  const onRemoveColumn: Actions["onRemoveColumn"] = (column) => {
    onChange({
      columns: value.columns.filter((c) => c !== column),
      columnLabels: omit(value.columnLabels ?? {}, [column]),
      data: value.data.map((row) => omit(row, [column])),
    });
  };

  const findNewColumnName = () => {
    let columnName = "New Column";
    let i = 1;
    while (value.columns.indexOf(columnName) !== -1) {
      columnName = `New Column ${i}`;
      i += 1;
    }
    return columnName;
  };

  const onAddColumn: Actions["onAddColumn"] = (column, toTheLeft) => {
    const columnName = findNewColumnName();
    const newColumns = [...value.columns];
    newColumns.splice(
      value.columns.indexOf(column) + (toTheLeft ? 0 : 1),
      0,
      columnName,
    );
    onChange({
      columns: newColumns,
      data: value.data.map((row) =>
        orderedKeys({ ...row, [columnName]: emptyCell() }, newColumns),
      ),
    });
  };

  const onMoveColumn: Actions["onMoveColumn"] = (column, toTheLeft) => {
    const newColumns = moveItemInArray(
      value.columns,
      value.columns.indexOf(column),
      toTheLeft,
    );
    onChange({
      columns: newColumns,
      data: value.data.map((row) => orderedKeys(row, newColumns)),
    });
  };

  const onAddRow: Actions["onAddRow"] = (row, toTheBottom) => {
    const newRow = Object.fromEntries(
      value.columns.map((column) => [column, emptyCell()]),
    );
    const newData = [...value.data];
    newData.splice(row + (toTheBottom ? 1 : 0), 0, newRow);
    onChange({ ...value, data: newData });
  };

  const onMoveRow: Actions["onMoveRow"] = (row, toTheBottom) => {
    onChange({
      ...value,
      data: moveItemInArray(value.data, row, !toTheBottom),
    });
  };

  const onRemoveRow: Actions["onRemoveRow"] = (row) => {
    const newData = [...value.data];
    newData.splice(row, 1);
    onChange({ ...value, data: newData });
  };

  const onMultipleCellUpdate: Actions["onMultipleCellUpdate"] = (
    index,
    id,
    table,
  ) => {
    let currentRow = index;
    let currentCol = value.columns.indexOf(id);

    const newData = [...value.data];
    const emptyRowTemplate = Object.fromEntries(
      value.columns.map((column) => [column, emptyCell()]),
    );

    for (const row of table) {
      if (currentRow === newData.length) {
        newData.push({ ...emptyRowTemplate });
      }
      for (const cellValue of row) {
        if (currentCol < value.columns.length) {
          newData[currentRow][value.columns[currentCol]] =
            stringToCellValue(cellValue);
          currentCol += 1;
        }
      }
      currentRow += 1;
      currentCol = value.columns.indexOf(id);
    }

    onChange({ ...value, data: newData });
  };

  const handleClear = async () => {
    const result = await ctx.openConfirm({
      title: "Clear the table?",
      content:
        "Are you sure you want to clear the table and start over? All rows and headers will be destroyed.",
      choices: [
        { label: "Yes, clear the table", value: true, intent: "negative" },
      ],
      cancel: { label: "Go back", value: false },
    });
    if (result === true) onChange(null);
  };

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns: tableColumns,
        data: value.data,
        defaultColumn,
        columnLabels: value.columnLabels,
        onCellUpdate,
        onColumnRename,
        onAddColumn,
        onAddRow,
        onMoveColumn,
        onRemoveColumn,
        onRemoveRow,
        onMultipleCellUpdate,
      } as unknown as TableOptions<Row>,
      useResizeColumns,
      useFlexLayout,
    );

  const tbodyRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tbodyRef.current) return;
    const tbody = tbodyRef.current;
    const handler = (event: Event) => {
      if (!theadRef.current) return;
      const target = event.target;
      if (target instanceof Element) {
        theadRef.current.scrollLeft = target.scrollLeft;
      }
    };
    tbody.addEventListener("scroll", handler);
    return () => tbody.removeEventListener("scroll", handler);
  }, []);

  return (
    <div>
      <div {...getTableProps()} className={s.table}>
        {/* Header */}
        <div className={s.thead} ref={theadRef} style={{ overflowX: "hidden" }}>
          {headerGroups.map((headerGroup) => {
            const { key: groupKey, ...groupProps } =
              headerGroup.getHeaderGroupProps();
            return (
              <div key={groupKey} {...groupProps} className={s.tr}>
                {headerGroup.headers.map((col) => {
                  const column = col as unknown as ResizableColumn;
                  const { key: colKey, ...colProps } = column.getHeaderProps();
                  return (
                    <div key={colKey} {...colProps} className={s.th}>
                      {column.render("Header")}
                      <div
                        {...column.getResizerProps()}
                        className={classNames(s.resizer, {
                          [s.isResizing]: column.isResizing,
                        })}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div
          {...getTableBodyProps()}
          ref={tbodyRef}
          style={{ overflowX: "auto" }}
        >
          {rows.map((row, i) => {
            prepareRow(row);
            const { key: rowKey, ...rowProps } = row.getRowProps();
            return (
              <div key={rowKey} {...rowProps} className={s.tr}>
                <div className={s.dropdownWrapper}>
                  <Dropdown
                    renderTrigger={({ onClick }) => (
                      <button
                        onClick={onClick}
                        className={s.handle}
                        type="button"
                      />
                    )}
                  >
                    <DropdownMenu>
                      <DropdownOption
                        onClick={onMoveRow.bind(null, i, false)}
                        disabled={i === 0}
                      >
                        <FontAwesomeIcon icon={faLongArrowAltUp} /> Move row up
                      </DropdownOption>
                      <DropdownOption
                        onClick={onMoveRow.bind(null, i, true)}
                        disabled={i === rows.length - 1}
                      >
                        <FontAwesomeIcon icon={faLongArrowAltDown} /> Move row
                        down
                      </DropdownOption>
                      <DropdownSeparator />
                      <DropdownOption onClick={onAddRow.bind(null, i, false)}>
                        <FontAwesomeIcon icon={faLongArrowAltUp} /> Add row
                        above
                      </DropdownOption>
                      <DropdownOption onClick={onAddRow.bind(null, i, true)}>
                        <FontAwesomeIcon icon={faLongArrowAltDown} /> Add row
                        below
                      </DropdownOption>
                      <DropdownSeparator />
                      <DropdownOption red onClick={onRemoveRow.bind(null, i)}>
                        <FontAwesomeIcon icon={faTrashAlt} /> Remove row
                      </DropdownOption>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                {row.cells.map((cell) => {
                  const { key: cellKey, ...cellProps } = cell.getCellProps();
                  return (
                    <div key={cellKey} {...cellProps} className={s.td}>
                      {cell.render("Cell")}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className={s.actions}>
        <Button
          onClick={onAddRow.bind(null, value.data.length, true)}
          buttonSize="s"
          leftIcon={<FontAwesomeIcon icon={faPlus} />}
        >
          Add new row
        </Button>

        <div className={s.actionsSpacer} />

        {onOpenInFullScreen && (
          <Button
            onClick={onOpenInFullScreen}
            buttonSize="s"
            leftIcon={<FontAwesomeIcon icon={faExpand} />}
          >
            Edit in full-screen
          </Button>
        )}
        <Button
          onClick={handleClear}
          buttonSize="s"
          leftIcon={<FontAwesomeIcon icon={faTrash} />}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
