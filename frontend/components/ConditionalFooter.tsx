"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on goals and checklists pages
  const hideFooter = pathname === "/goals" || pathname === "/checklists";

  if (hideFooter) {
    return null;
  }

  return <Footer />;
}
