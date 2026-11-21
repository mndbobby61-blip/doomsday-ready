import { useEffect } from 'react';

/** Run `handler` when the Escape key is pressed (used by dialogs). */
export default function useEscape(handler) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') handler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler]);
}