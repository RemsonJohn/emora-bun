import type { ComponentProps } from "react";
import { OverviewPage } from "../shared/OverviewPage";

export function HomePage(
  props: Omit<ComponentProps<typeof OverviewPage>, "page">,
) {
  return <OverviewPage {...props} page="Home" />;
}
