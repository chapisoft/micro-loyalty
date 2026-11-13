import { DEFAULT_PAGE_SIZE } from '@/constants';
import { partnerService } from '@/service/partner.service';
import { debounce } from 'lodash';
import React from 'react';

interface DefaultOptionType {
  id: string;
  name: string;
}

const usePartnerOptions = () => {
  const [allOptions, setAllOptions] = React.useState<DefaultOptionType[]>([]);
  const [options, setOptions] = React.useState<DefaultOptionType[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [limit, setLimit] = React.useState<number>(DEFAULT_PAGE_SIZE);

  React.useEffect(() => {
    let active = true;
    setIsLoading(true);
    partnerService
      .getAll()
      .then((list) => {
        if (!active) return;
        const mapped = (Array.isArray(list) ? list : []).map((item) => ({
          id: String(item.id),
          name: item.partnerName || item.partnerCode,
        }));
        setAllOptions(mapped);
        setOptions(mapped.slice(0, DEFAULT_PAGE_SIZE));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const hasNextPage = options.length < allOptions.length;

  const loadMore = React.useCallback(() => {
    if (!hasNextPage || isLoading) return;
    const nextLimit = limit + DEFAULT_PAGE_SIZE;
    setLimit(nextLimit);
    setOptions(allOptions.slice(0, nextLimit));
  }, [allOptions, hasNextPage, isLoading, limit]);

  const onSearch = debounce((value: string) => {
    const kw = (value || '').trim().toLowerCase();
    const filtered = kw
      ? allOptions.filter((o) => o.name.toLowerCase().includes(kw))
      : allOptions;
    setOptions(filtered.slice(0, limit));
  }, 300);

  return {
    options,
    isLoading,
    hasNextPage,
    loadMore,
    onSearch,
  };
};

export default usePartnerOptions;
