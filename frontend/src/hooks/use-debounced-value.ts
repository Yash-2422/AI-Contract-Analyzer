import { useEffect, useState } from "react";

/**
 * Delays propagation of a rapidly changing value (typically a search box)
 * so the API sees one request after a short pause instead of one per key.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}
