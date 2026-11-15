import type { ReactNode } from "react";
import { ListToolbar } from "./ListToolbar";
import { Pagination } from "./Pagination";
import { TableLoading } from "./TableLoading";

export type EntityListControls = {
  status: string;
  setStatus: (value: string) => void;
  setOffset: (value: number) => void;
  listSearch: string;
  setListSearch: (value: string) => void;
  busy: boolean;
  demo: boolean;
  totalCount: number;
  offset: number;
};

export function EntityListLayout({
  label,
  tabs,
  note,
  children,
  ...controls
}: EntityListControls & {
  label: string;
  tabs: { key: string; label: string }[];
  note?: string;
  children: ReactNode;
}) {
  const {
    status,
    setStatus,
    setOffset,
    listSearch,
    setListSearch,
    busy,
    demo,
    totalCount,
    offset,
  } = controls;
  return (
    <section className="panel list-panel">
      <ListToolbar
        tabs={tabs}
        selected={status}
        onSelect={(value) => {
          setStatus(value);
          setOffset(0);
        }}
        searchLabel={label}
        searchValue={listSearch}
        onSearch={setListSearch}
      />
      {busy ? <TableLoading /> : children}
      <Pagination
        totalCount={totalCount}
        offset={offset}
        disabled={busy || demo}
        onOffsetChange={setOffset}
        note={note}
      />
    </section>
  );
}
