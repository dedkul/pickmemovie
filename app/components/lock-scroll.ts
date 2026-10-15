// Lock page scroll under popups without the layout shifting: hiding the
// scrollbar frees its width, so pad the page by exactly that much.
// Counted, so the filter sheet and a dialog can both hold the lock.
let holders = 0;

export function lockScroll(on: boolean) {
  const h = document.documentElement;
  holders = Math.max(0, holders + (on ? 1 : -1));
  if (on && holders === 1) {
    const bar = window.innerWidth - h.clientWidth;
    h.style.overflow = "hidden";
    h.style.paddingRight = bar ? `${bar}px` : "";
  } else if (!holders) {
    h.style.overflow = "";
    h.style.paddingRight = "";
  }
}
