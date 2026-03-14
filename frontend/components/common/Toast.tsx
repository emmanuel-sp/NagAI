"use client";

import { useEffect, ReactNode } from "react";
import { IoCheckmarkCircle, IoAlertCircle, IoClose } from "@/components/icons";
import styles from "./Toast.module.css";

interface ToastProps {
  message: ReactNode;
  onClose: () => void;
  duration?: number;
  variant?: "success" | "error";
}

export default function Toast({ message, onClose, duration = 6000, variant = "success" }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = variant === "error" ? IoAlertCircle : IoCheckmarkCircle;

  return (
    <div className={`${styles.toast} ${variant === "error" ? styles.toastError : ""}`}>
      <div className={styles.toastContent}>
        <Icon className={`${styles.toastIcon} ${variant === "error" ? styles.toastIconError : ""}`} size={24} />
        <p className={styles.toastMessage}>{message}</p>
      </div>
      <button onClick={onClose} className={styles.toastClose}>
        <IoClose size={20} />
      </button>
    </div>
  );
}
