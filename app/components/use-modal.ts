"use client";

import { useEffect, useRef } from "react";
import { lockScroll } from "./lock-scroll";

// A native <dialog> shown modally for as long as the component is mounted.
// The browser traps focus; this adds the scroll lock, Escape and backdrop-click
// closing through React state, and gives focus back on close.
export function useModal(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });

  useEffect(() => {
    const dialog = ref.current!;
    const returnTo = document.activeElement as HTMLElement | null;
    dialog.showModal();
    lockScroll(true);
    const onCancel = (e: Event) => { e.preventDefault(); close.current(); };
    const onClick = (e: MouseEvent) => { if (e.target === dialog) close.current(); }; // the backdrop
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("click", onClick);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("click", onClick);
      dialog.close();
      lockScroll(false);
      if (returnTo?.isConnected) returnTo.focus();
    };
  }, []);

  return ref;
}
