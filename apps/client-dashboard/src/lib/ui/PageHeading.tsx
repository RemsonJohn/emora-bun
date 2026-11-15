import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function PageHeading({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  back?: () => void;
}) {
  return (
    <div className="page-heading">
      <div>
        {back && (
          <button type="button" className="back-link" onClick={back}>
            <ArrowLeft size={15} />
            Back
          </button>
        )}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
