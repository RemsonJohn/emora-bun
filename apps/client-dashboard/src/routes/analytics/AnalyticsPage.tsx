import type { ComponentProps } from "react";
import { OverviewPage } from "../shared/OverviewPage";

export function AnalyticsPage(
  props: Omit<ComponentProps<typeof OverviewPage>, "page">,
) {
  return <OverviewPage {...props} page="Analytics" />;
}
