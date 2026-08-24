export interface IPaging {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface IPagingParams {
  page: number;
  pageSize: number;
}

export interface IResponse<T> {
  code: number;
  data: T;
  status: number;
  message?: string;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalElements?: number;
}

export interface IPagingResponse<T> extends ICommonResponse<T> {
  paging: IPaging;
}
