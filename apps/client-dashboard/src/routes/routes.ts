import {
  ChartNoAxesCombined,
  CreditCard,
  Home,
  Layers,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";

export type Page =
  | "Home"
  | "Orders"
  | "Billing"
  | "Products"
  | "Collections"
  | "Inventory"
  | "Customers"
  | "Discounts"
  | "Content"
  | "Analytics"
  | "Settings";
export const nav = [
  { name: "Home", icon: Home },
  { name: "Orders", icon: ShoppingBag },
  { name: "Billing", icon: CreditCard },
  { name: "Products", icon: Tag },
  { name: "Customers", icon: Users },
  { name: "Discounts", icon: ShoppingCart },
  { name: "Content", icon: Layers },
  { name: "Analytics", icon: ChartNoAxesCombined },
] as const;
const validPages = [
  ...nav.map((n) => n.name),
  "Settings",
  "Collections",
  "Inventory",
];
export function initialPage(): Page {
  const page = new URLSearchParams(location.search).get("page");
  return validPages.includes(page || "") ? (page as Page) : "Home";
}
