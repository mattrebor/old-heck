import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn('test');
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous invocation if called again within delay', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn('first');
    vi.advanceTimersByTime(200);

    debouncedFn('second');
    vi.advanceTimersByTime(200);

    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledWith('second');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should work with multiple arguments', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn('arg1', 'arg2', 'arg3');
    vi.advanceTimersByTime(500);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should work with async functions', async () => {
    const mockAsyncFn = vi.fn(async (value: string) => {
      return `Result: ${value}`;
    });
    const debouncedFn = debounce(mockAsyncFn, 500);

    debouncedFn('test');
    vi.advanceTimersByTime(500);

    // Wait for async function to complete
    await vi.runAllTimersAsync();

    expect(mockAsyncFn).toHaveBeenCalledWith('test');
  });

  it('should allow multiple separate invocations after delay', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn('first');
    vi.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledWith('first');

    debouncedFn('second');
    vi.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledWith('second');

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should use custom delay', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 1000);

    debouncedFn('test');
    vi.advanceTimersByTime(999);
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should handle rapid successive calls correctly', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    // Rapid calls
    for (let i = 0; i < 10; i++) {
      debouncedFn(i);
      vi.advanceTimersByTime(50);
    }

    // Only the last call should execute
    vi.advanceTimersByTime(450);
    expect(mockFn).toHaveBeenCalledWith(9);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
