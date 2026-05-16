import { useEffect, type RefObject } from 'react';

// We use <T extends HTMLElement> to make it flexible
// We use RefObject<T | null> because React refs start as null
export const useOnClickOutside = <T extends HTMLElement>(
  ref: RefObject<T | null>, 
  handler: (event: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;

      // Do nothing if clicking ref's element or descendent elements
      // We also check if el exists to satisfy TS
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};