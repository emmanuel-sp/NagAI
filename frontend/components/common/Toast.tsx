"use client";

import { useEffect, ReactNode } from "react";
import { IoCheckmarkCircle, IoClose } from "react-icons/io5";
import styles from "@/styles/common/toast.module.css";

interface ToastProps {
  message: ReactNode;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 6000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={styles.toast}>
      <div className={styles.toastContent}>
        <IoCheckmarkCircle className={styles.toastIcon} size={24} />
        <p className={styles.toastMessage}>{message}</p>
      </div>
      <button onClick={onClose} className={styles.toastClose}>
        <IoClose size={20} />
      </button>
    </div>
  );
}
