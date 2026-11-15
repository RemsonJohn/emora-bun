import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { Download } from "lucide-react";
import "./table-export.css";

type NodeProps = { children?: ReactNode };

function cells(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const safe = /^[=+\-@\t\r]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** Selection and export intentionally cover the current rendered page only. */
export function SelectableTable({
  name,
  children,
}: {
  name: string;
  children: ReactElement<NodeProps>;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{
    page: string;
    ids: Set<string>;
  }>({ page: "", ids: new Set() });
  const sections = Children.toArray(children.props.children);
  const body = sections.find(
    (section) => isValidElement<NodeProps>(section) && section.type === "tbody",
  ) as ReactElement<NodeProps> | undefined;
  const rows = Children.toArray(body?.props.children).filter(
    isValidElement,
  ) as ReactElement<NodeProps>[];
  const ids = rows.map((row, index) => String(row.key ?? index));
  const page = JSON.stringify(ids);
  const selected = selection.page === page ? selection.ids : new Set<string>();
  const activeIds = ids.filter((id) => selected.has(id));
  const allSelected = ids.length > 0 && activeIds.length === ids.length;

  const toggle = (id: string) =>
    setSelection((current) => {
      const next = new Set(current.page === page ? current.ids : []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { page, ids: next };
    });
  const toggleAll = () =>
    setSelection({ page, ids: allSelected ? new Set() : new Set(ids) });
  const exportCsv = (onlySelected: boolean) => {
    const table = container.current?.querySelector("table");
    if (!table) return;
    const headings = Array.from(table.querySelectorAll("thead th"))
      .slice(1)
      .map((th) => (th as HTMLElement).innerText.trim());
    const columns = headings
      .map((heading, index) => ({ heading, index }))
      .filter(
        (column) =>
          column.heading &&
          !/^(actions|details|stock management)$/i.test(column.heading),
      );
    const data = Array.from(table.querySelectorAll("tbody tr"))
      .filter((_, index) => !onlySelected || selected.has(ids[index]))
      .map((row) => {
        const values = Array.from(row.querySelectorAll(":scope > td")).slice(1);
        return columns
          .map((column) =>
            cells(
              (values[column.index] as HTMLElement | undefined)?.innerText ||
                "",
            ),
          )
          .join(",");
      });
    const content =
      "\ufeff" +
      [columns.map((column) => cells(column.heading)).join(","), ...data].join(
        "\r\n",
      );
    const link = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    );
    link.href = url;
    link.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${onlySelected ? "selected" : "current-page"}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const transformed = sections.map((section) => {
    if (!isValidElement<NodeProps>(section)) return section;
    if (section.type === "thead")
      return cloneElement(
        section,
        {},
        Children.map(section.props.children, (row) => {
          if (!isValidElement<NodeProps>(row) || row.type !== "tr") return row;
          return cloneElement(
            row,
            {},
            <>
              <th className="selection-cell">
                <input
                  type="checkbox"
                  aria-label={`Select all rows in ${name}`}
                  checked={allSelected}
                  disabled={!ids.length}
                  ref={(element) => {
                    if (element)
                      element.indeterminate =
                        activeIds.length > 0 && !allSelected;
                  }}
                  onChange={toggleAll}
                />
              </th>
              {row.props.children}
            </>,
          );
        }),
      );
    if (section.type === "tbody")
      return cloneElement(
        section,
        {},
        rows.map((row, index) =>
          cloneElement(
            row,
            { key: ids[index] },
            <>
              <td className="selection-cell">
                <input
                  type="checkbox"
                  aria-label={`Select row ${index + 1} in ${name}`}
                  checked={selected.has(ids[index])}
                  onChange={() => toggle(ids[index])}
                />
              </td>
              {row.props.children}
            </>,
          ),
        ),
      );
    return section;
  });
  return (
    <div className="selectable-table" ref={container}>
      <div className="selection-toolbar">
        <span>
          {activeIds.length
            ? `${activeIds.length} selected`
            : `${ids.length} rows on this page`}
        </span>
        <div>
          <button
            type="button"
            className="button"
            disabled={!activeIds.length}
            onClick={() => exportCsv(true)}
          >
            <Download size={14} />
            Export selected
          </button>
          <button
            type="button"
            className="button"
            disabled={!ids.length}
            onClick={() => exportCsv(false)}
          >
            <Download size={14} />
            Export current page
          </button>
        </div>
      </div>
      <div className="selectable-table-scroll">
        {cloneElement(children, {}, transformed)}
      </div>
    </div>
  );
}
