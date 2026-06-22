import type { IconName } from "@/components/ui/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

/** Left-rail navigation — order matches the product spec. */
export const NAV: NavItem[] = [
  { href: "/campaigns", label: "Email Campaigns", icon: "mail" },
  { href: "/inbox", label: "Master Inbox", icon: "inbox" },
  { href: "/accounts", label: "Email Accounts", icon: "accounts" },
  { href: "/analytics", label: "Global Analytics", icon: "chart" },
];

export const DEFAULT_ROUTE = "/analytics";
