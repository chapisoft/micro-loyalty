import { DEFAULT_PAGE_SIZE } from '@/constants';
import { IBaseRequestPagingParams } from '@/models';
import { useGetMerchantsController } from '@/service/general/general';
import { debounce } from 'lodash';
import React from 'react';

interface DefaultOptionType {
  id: string;
  name: number;
}

const usePartnerOptions = () => {
  const [options, setOptions] = React.useState<DefaultOptionType[]>([]);
  const [hasNextPage, setHasNextPage] = React.useState<boolean>(true);
  const searchParams = React.useRef<IBaseRequestPagingParams>({
    pageSize: DEFAULT_PAGE_SIZE,
    pageNumber: 1,
  });

  const { data, isLoading, refetch } = useGetMerchantsController(searchParams.current);

  React.useEffect(() => {
    if (data) {
      const newOptions: DefaultOptionType[] = (data?.merchants || []).map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
      setOptions(newOptions);
      setHasNextPage(data.totalPages > 1);
    }
  }, [data]);

  React.useEffect(() => {
    searchParams.current = {
      pageSize: DEFAULT_PAGE_SIZE,
      pageNumber: 1,
    };
    refetch();
  }, [refetch]);

  const loadMore = React.useCallback(() => {
    if (!hasNextPage || isLoading) return;
    searchParams.current.pageSize += DEFAULT_PAGE_SIZE;
    refetch();
  }, [hasNextPage, isLoading, refetch]);

  const onSearch = debounce((value: string) => {
    searchParams.current.pageIndex = 1;
    searchParams.current.Search = value;
    refetch();
  }, 500);

  return {
    search: searchParams.current,
    options,
    isLoading,
    hasNextPage,
    loadMore,
    onSearch,
  };
};

export default usePartnerOptions;
