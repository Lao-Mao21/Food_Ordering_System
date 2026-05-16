import React, { type FC, type ReactNode, type MouseEventHandler } from "react";
import { Icon } from "../../ui";
import { Select } from "../forms/Select";

/* =========================
   TABLE
========================= */
export const Table: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="rounded-2xl border border-border-muted bg-bg-light shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  </div>
);

/* =========================
   HEADER
========================= */
export const TableHeader: FC<{ children: ReactNode }> = ({ children }) => (
  <thead className="text-xs uppercase tracking-wider text-text-muted border-b border-border-muted">
    {children}
  </thead>
);

/* =========================
   BODY
========================= */
export const TableBody: FC<{ children: ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-border-muted/30">
    {children}
  </tbody>
);

/* =========================
   ROW
========================= */
export const TableRow = React.forwardRef<HTMLTableRowElement, { children: ReactNode; className?: string; onClick?: MouseEventHandler<HTMLTableRowElement> }>(({
  children, className = "", onClick }, ref) => (
  <tr
    ref={ref}
    onClick={onClick}
    className={`
      transition
      ${onClick ? "cursor-pointer hover:bg-primary/5" : ""}
      ${className}
    `}
  >
    {children}
  </tr>
));

/* =========================
   CELL (WITH SORTABLE)
========================= */
interface TableCellProps<T = string> {
  children?: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  isHeader?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
  sortKey?: T;
  currentSort?: { key: T; direction: "asc" | "desc" };
  onSort?: (key: T) => void;
}

export const TableCell = <T extends string = string>({
  children,
  colSpan,
  rowSpan,
  isHeader,
  className = "",
  align = "left",
  sortKey,
  currentSort,
  onSort,
}: TableCellProps<T>) => {
  const Tag = isHeader ? "th" : "td";

  const isSortable = isHeader && sortKey && onSort;
  const isActive = currentSort?.key === sortKey;

  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <Tag
      colSpan={colSpan}
      rowSpan={rowSpan}
      onClick={() => isSortable && onSort!(sortKey!)}
      className={`
        px-5 py-4 whitespace-nowrap
        ${isHeader ? "text-text-muted font-semibold" : "text-text"}
        ${isSortable ? "cursor-pointer group" : ""}
        ${alignClass}
        ${rowSpan && rowSpan > 1 ? "align-top" : ""}
        ${className}
      `}
    >
      <div className={`flex items-center gap-2 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}>
        {children}

        {isSortable && (
          <div className="flex flex-col leading-none">
            <Icon
              iconName="FaChevronUp"
              size={10}
              className={
                isActive && currentSort?.direction === "asc"
                  ? "text-primary"
                  : "text-text-muted/40 group-hover:text-primary"
              }
            />
            <Icon
              iconName="FaChevronDown"
              size={10}
              className={
                isActive && currentSort?.direction === "desc"
                  ? "text-primary"
                  : "text-text-muted/40 group-hover:text-primary"
              }
            />
          </div>
        )}
      </div>
    </Tag>
  );
};

/* =========================
   PAGINATION
========================= */
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalResults: number;
  pageSize: number;
}

export const TablePagination: FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
  totalResults,
  pageSize,
}) => {
  const start = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalResults);

  const pageSizeOptions = [
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const getPages = () => {
    if (totalPages <= 3) return [...Array(totalPages)].map((_, i) => i + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= totalPages - 1)
      return [totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 1, currentPage, currentPage + 1];
  };

  const pages = getPages();

  return (
    <div className="mt-4 flex flex-col lg:flex-row items-center justify-between gap-4 px-5 py-4 border border-border-muted bg-bg-light rounded-2xl">

      {/* LEFT */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-text-muted">Show</span>
        <div className="w-20">
          <Select
            value={pageSize.toString()}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            options={pageSizeOptions}
            fullWidth
          />
        </div>

        <span className="text-xs text-text-muted">
          <span className="text-primary">{start}</span> -{" "}
          <span className="text-primary">{end}</span> of{" "}
          <span className="text-primary">{totalResults}</span>
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1">

        {/* PREV */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 disabled:opacity-30"
        >
          <Icon iconName="FaChevronLeft" size={10} />
        </button>

        {/* PAGES */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              w-8 h-8 rounded-lg text-xs
              ${currentPage === page
                ? "bg-primary text-white"
                : "text-text-muted hover:bg-primary/10"
              }
            `}>
            {page}
          </button>
        ))}

        {/* NEXT */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 disabled:opacity-30"
        >
          <Icon iconName="FaChevronRight" size={10} />
        </button>

      </div>
    </div>
  );
};