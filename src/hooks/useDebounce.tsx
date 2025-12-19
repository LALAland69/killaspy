import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para debounce de valores - atrasa a atualização até que o usuário pare de digitar
 * @param value - Valor a ser debounced
 * @param delay - Tempo de espera em ms (padrão: 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para criar uma função debounced - útil para callbacks
 * @param callback - Função a ser executada após o delay
 * @param delay - Tempo de espera em ms (padrão: 300ms)
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Atualiza a referência do callback quando ele mudar
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Limpa o timeout quando o componente desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  return debouncedCallback;
}
