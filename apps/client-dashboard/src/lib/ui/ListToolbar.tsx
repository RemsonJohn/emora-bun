import { Search, SlidersHorizontal } from "lucide-react";

type Tab = { key: string; label: string };

export function ListToolbar({
  tabs,
  selected,
  onSelect,
  searchLabel,
  searchValue,
  onSearch,
}: {
  tabs: readonly Tab[];
  selected: string;
  onSelect: (value: string) => void;
  searchLabel: string;
  searchValue: string;
  onSearch: (value: string) => void;
}) {
  return (
    <>
      <div className="list-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={selected === tab.key ? "selected" : ""}
            onClick={() => onSelect(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="table-tools">
        <label className="table-search">
          <Search size={16} />
          <input
            aria-label={`Search ${searchLabel}`}
            placeholder={`Search ${searchLabel.toLowerCase()}…`}
            value={searchValue}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
        <span className="muted">
          <SlidersHorizontal size={15} />
          Search &amp; filter
        </span>
      </div>
    </>
  );
}
