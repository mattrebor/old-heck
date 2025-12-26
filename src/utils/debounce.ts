/**
 * Creates a debounced function that delays invoking the provided function
 * until after `delay` milliseconds have elapsed since the last time it was invoked.
 *
 * @param func The function to debounce
 * @param delay The number of milliseconds to delay
 * @returns A debounced version of the function with a cancel method
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as typeof debounced & { cancel: () => void };
}
