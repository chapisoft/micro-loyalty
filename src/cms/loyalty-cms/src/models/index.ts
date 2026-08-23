export interface IPagination {
  count: number;
  pageIndex: number;
  pageSize: number;
  totalPage: number;
}

export interface IDefaultResponse {
  status: number;
  succeeded: boolean;
  code: number;
  message: string;
  pagination: IPagination;
}

export interface IPageResponse<T> extends IDefaultResponse {
  data: T[];
}

export interface IDetailResponse<T> extends IDefaultResponse {
  body: T;
}

export interface IPageableParams {
  page: number;
  size: number;
  orderBy?: string;
  orderDirection?: string;
}

export interface IBaseRequestPagingParams {
  pageNumber: number;
  pageSize: number;
  keyword?: string;
  search?: string;
  [key: string]: any;
}

export interface IFilterParams extends IBaseRequestPagingParams {
  search?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  isAscCreateDate?: any;
  typeName?: string;
}

export interface ISortableParams {
  orderBy?: string;
  orderDirection?: string;
}

export interface ILanguage {
  code: string;
  name: string;
}

export interface IPotentialCustomer {
  name: string;
  userName: string;
  code?: string;
  phonenumber: string;
  email?: string;
  link?: string;
  taxCode?: string;
  isOrganization: boolean;
  representative: string;
  historyTransaction: number;
  historyTransactionName?: string;
  isOnline?: boolean;
  accessChannel: number;
  accessChannelName?: string;
  source: number;
  sourceName?: string;
  note?: string;
  service?: number;
  serviceDetail?: string;
  customerOrderId?: number;
  orderCode: string;
  feedbackStar?: number;
  feedbackContent?: string;
  feedbackDate: string;
  statusId: number;
  isActive: boolean;
  supplier: number;
  potentialCustomerHistorys: IPotentialCustomerHistory[];
  total: number;
  id: number;
  isDelete: boolean;
  updatedBy?: string;
  updatedAt?: string;
  createdBy: string;
  createdAt: string;
}

interface IPotentialCustomerHistory {
  content: string;
  staffName: string;
}

export interface IBooking {
  id: number;
  appointmentDate: Date;
  bookingProducts: Date;
  code: string;
  createdAt: string;
  createdBy: string;
  description: string;
  endTime: string;
  isActive: true;
  isDelete: false;
  isView: true;
  name: null;
  objectMenuId: number;
  startTime: string;
  status?: number;
  type: number;
  typeName: string;
  updatedAt: Date | null;
  updatedBy: Date | null;
  userAccount: string;
}

export interface IUser {
  userName?: string;
  code: string;
  referralCode?: string;
  name: string;
  taxCode?: string;
  isOrganization: boolean;
  representative?: string;
  phonenumber: string;
  email?: string;
  doB?: string;
  provinceId?: number;
  districtId?: number;
  wardId?: number;
  address: string;
  cccd: string;
  cccdCreateAt: string;
  cccdPlaceOfGrant?: string;
  sex: boolean;
  link?: string;
  imageId?: number;
  isActive?: boolean;
  customerType: number;
  accountName?: string;
  accountNumber?: string;
  bankId?: number;
  bank?: string;
  total: number;
  groups?: string;
  customerFiles?: IFile[];
  statusHistory?: string;
  id: number;
  isDelete: boolean;
  updatedBy?: string;
  updatedAt?: string;
  createdBy?: string;
  createdAt: string;
}

export interface ICity {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  isDelete: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface IDistrict {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  isDelete: boolean;
  provinceId: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface IWard {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  isDelete: boolean;
  districtId: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface IStreet {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  isDelete: boolean;
  wardId: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface IFile {
  customerId: number;
  fileId: number;
  file?: string | null;
  isDelete: boolean;
}

export interface ICustomerRating {
  address: string | null;
  code?: string;
  createdAt: string;
  createdBy?: string | null;
  customerStatus: string;
  email?: string | null;
  id: number;
  isActive: boolean;
  name: string;
  ordinal: 0;
  phonenumber: string;
  sex: boolean;
  totalMoney: number;
}

export interface ICustomerDebt {
  code: string | null;
  consignmentPrice: number | null;
  content: string;
  createdAt: string;
  currentDebt: number;
  currentInterest: number;
  debt: number;
  id: number;
  isKeepDeposite: boolean;
  isReceiptedMoney: boolean;
  negotiatePrice: number | null;
  orderCode: string;
  orderCodeBTSpa: string | null;
  orderId: number;
  orderIdBTSpa: number | null;
  orderTypeBTSpa: string | null;
  paidMoney: number;
  paymentMethods: number;
  paymentRequestCode: string | null;
  paymentRequestId: number | null;
  productCode: string | null;
  productName: string | null;
  receiptOrPaymentVoucherCode: string | null;
  receiptOrPaymentVoucherId: number | null;
  receiveMoney: number;
  rentalPriceByDay: number | null;
  returnRequestId: number | null;
  spaService: any | null;
  status: number;
  totalPrice: number;
  totalPriceSpa: number | null;
  totalPriceRental: number | null;
  totalPriceSale: number | null;
  typeOfAccountingEntry: number;
  typeOfMoney: number;
  typeOfPayment: number;
  unitPrice: number | null;
  
  idKhachHang: number;
  tenKhachHang: string;
  doanhThu: number;
  soTienTra: number;
  congNo: number;
}
export interface ICustomerOrder {
  accountingEntry?: string;
  address?: string;
  branchId?: number;
  branchName?: string;
  code: string;
  count: number;
  createdAt: string;
  createdBy: string;
  currentDebt: number;
  currentInterest: number;
  statusName: string;
  toDate?: string;
  todayInterest: number;
  totalDebt: number;
  totalPrice: number;
  totalQuantity: number;
  unitName?: string;
  userName: string;
  vat: number;
  vatMoney: number;
  vatName: string;
  wardId: number;
  warehouseId: number;
  warehouseName?: string;
  serviceType: number;
  customer: IUser;
}

export interface IRating {
  id: number;
  name: string;
  images: IImage[];
  rankingType: number;
  rankingTypeName: string;
  targetMoney: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface ICustomerPoint {
  customerCode: string;
  customerImage?: string | null;
  customerName: string;
  email?: string | null;
  id: number;
  phoneNumber: string;
  rechargePoint: number;
  status: number;
  totalPoint: number;
  transaction?: ITransaction[];
  usedPoint: number;
}

export interface IImage {
  fileId: number;
  path?: string | null;
}

export interface ITransaction {
  id: number;
  pointExchangeType: number;
  orderCode: string;
  campaignCode: string;
  referralCode: string;
  pointExchangeCode: string;
  type: string;
  transactionPoint: number;
  pointAfterTransaction: number;
  createdAt: string;
  transactionStatus: number;
}

export interface IRanking {
  code?: string | null;
  createdAt: string;
  createdBy: string;
  description?: string | null;
  fileId: number | null;
  id: number;
  isActive: boolean;
  isDelete: boolean;
  name: string;
  rankingDateType: number;
  targetMoney: number;
  updatedAt: string;
  updatedBy: string;
}

export interface ITransferPagingRequest {
  pagination: IPaginationRequest;
  maChuyenkho: string;
  tuNgayXuat: string;
  denNgayXuat: string;
}

export interface IImportPagingRequest {
  pagination: IPaginationRequest;
  maDon: string;
  tuNgayNhap: string;
  denNgayNhap: string;
}
export interface IFindLablePagingRequest{
  pagination:IPaginationRequest
  barcode:string;
  productName:string;
}

export interface IProductLablePagingRequest {
  pagination: IPaginationRequest;
  barcode: string;
  productName: string;
}


export interface IPaginationRequest {
  pageNumber: number | undefined;
  pageSize: number | undefined;
}

export interface INewBaseRequestPagingParams {
  pagination: IPaginationRequest;
  keyword?: string;
  search?: string;
  [key: string]: any;
}

// Loyalty Domain Enums & Models
export enum CommonStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum TierLevel {
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

export enum CampaignMetric {
  BILL_AMOUNT = 'BILL_AMOUNT',
  TRANSACTION_COUNT = 'TRANSACTION_COUNT',
  EARN_POINTS = 'EARN_POINTS',
}

export enum DiscountType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE = 'PERCENTAGE',
}

export enum ClearingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SETTLED = 'SETTLED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}
