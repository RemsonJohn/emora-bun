import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export function Pagination({
  totalCount,
  offset,
  pageSize = 25,
  disabled,
  note,
  onOffsetChange,
}: {
  totalCount: number;
  offset: number;
  pageSize?: number;
  disabled?: boolean;
  note?: string;
  onOffsetChange: (offset: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {totalCount} results{note && ` · ${note}`}
      </span>
      <div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="icon-button"
          aria-label="Previous page"
          disabled={offset === 0 || disabled}
          onClick={() => onOffsetChange(Math.max(0, offset - pageSize))}
        >
          <ChevronLeft size={17} />
        </Button>
        <span>Page {offset / pageSize + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="icon-button"
          aria-label="Next page"
          disabled={disabled || offset + pageSize >= totalCount}
          onClick={() => onOffsetChange(offset + pageSize)}
        >
          <ChevronRight size={17} />
        </Button>
      </div>
    </div>
  );
}
