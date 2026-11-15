import { useState, useEffect, useCallback } from 'react';
import { categoryService, GeneralCategory } from '@/service/category.service';

export function useGeneralCategory(categoryType: string) {
  const [data, setData] = useState<GeneralCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (force = false) => {
      if (!categoryType) {
        setData([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const list = await categoryService.getCategoriesByType(categoryType, force);
        setData(list);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [categoryType]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mutate = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const getLabel = useCallback(
    (code: string, fallback?: string): string => {
      if (!code) return fallback || '';
      const found = data.find((item) => item.code.toUpperCase() === code.toUpperCase());
      return found?.name || fallback || code;
    },
    [data]
  );

  return {
    data,
    isLoading,
    error,
    mutate,
    getLabel,
  };
}
