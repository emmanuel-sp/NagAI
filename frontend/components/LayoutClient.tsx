"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";
import ConditionalFooter from "@/components/ConditionalFooter";
import styles from "./LayoutClient.module.css";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isChatPage = pathname === "/chat";
  const mainClass = isChatPage
    ? sidebarCollapsed
      ? styles.mainChatCollapsed
      : styles.mainChatWithSidebar
    : sidebarCollapsed
      ? styles.mainCollapsed
      : styles.mainWithSidebar;

  return (
    <>
      <NavBar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
      />
      <main className={mainClass}>{children}</main>
      <ConditionalFooter />
    </>
  );
}
