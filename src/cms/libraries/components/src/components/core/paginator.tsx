import React from 'react';

import { Paginator, PaginatorProps } from 'primereact/paginator';

type AppPaginatorProps = PaginatorProps;

const AppPaginator: React.FC<AppPaginatorProps> = ({ ...props }: AppPaginatorProps) => {
  return <Paginator {...props}></Paginator>;
};

export { AppPaginator };
