"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ModalContextType {
  modalOpen: boolean;
  registerModal: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [openCount, setOpenCount] = useState(0);

  const registerModal = useCallback((open: boolean) => {
    setOpenCount((c) => Math.max(0, c + (open ? 1 : -1)));
  }, []);

  return (
    <ModalContext.Provider value={{ modalOpen: openCount > 0, registerModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) return { modalOpen: false, registerModal: () => {} };
  return ctx;
}
