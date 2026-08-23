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
  message?: string;
  page?: number;
  pageSize?: number;
  totalPage?: number;
  totalElement?: number;
}

export interface IPagingResponse<T> extends ICommonResponse<T> {
  paging: IPaging;
}
