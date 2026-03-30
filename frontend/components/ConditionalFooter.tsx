"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  const hideFooter =
    pathname.startsWith("/goals") ||
    pathname === "/chat";

  if (hideFooter) {
    return null;
  }

  return <Footer />;
}
