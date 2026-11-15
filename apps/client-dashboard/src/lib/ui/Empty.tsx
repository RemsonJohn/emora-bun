import type { ReactNode } from "react";
import { Package } from "lucide-react";

export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Package size={32} strokeWidth={1.3} />
      <h3>{title}</h3>
      <p>
        {children || "Your store data will appear here once it’s available."}
      </p>
    </div>
  );
}
