"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { IoMoon, IoSunny } from "react-icons/io5";
import styles from "@/styles/themeToggle.module.css";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={styles.floatingToggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <IoMoon size={24} /> : <IoSunny size={24} />}
    </button>
  );
}
