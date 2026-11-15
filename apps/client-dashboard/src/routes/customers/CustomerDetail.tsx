import { ExternalLink } from "lucide-react";
import { date } from "../../lib/medusa";
import type { Customer } from "../../lib/medusa";
import { PageHeading } from "../../lib/ui/PageHeading";

export function CustomerDetail({
  customer,
  demo,
  nativeAdmin,
  onBack,
}: {
  customer: Customer;
  demo: boolean;
  nativeAdmin: (path: string) => string;
  onBack: () => void;
}) {
  return (
    <>
      <PageHeading
        title={
          `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
          "Customer"
        }
        description="Customer details"
        back={onBack}
      />
      <section className="panel detail-panel">
        <h2>Contact information</h2>
        <p>{customer.email}</p>
        <p>{customer.phone || "No phone number provided"}</p>
        <p>Customer since {date(customer.created_at)}</p>
        {!demo && (
          <a
            className="button"
            href={nativeAdmin(`/customers/${customer.id}`)}
            target="_blank"
            rel="noreferrer"
          >
            Manage customer <ExternalLink size={14} />
          </a>
        )}
      </section>
    </>
  );
}
