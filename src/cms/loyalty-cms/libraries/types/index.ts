import {AppProps} from "single-spa";

export type MicroAppProp = AppProps & {
  domElement?: HTMLElement;
  userData?: UserData;
  basename?: string;
  url?: string;
  env?: any;
  theme?: string;
  id?: string;
  accessToken?: string;
  userId?: string;
  onRefresh?: () => void;
};

export type UserData = {
  id?: number;
  ssoId?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  sex?: number;
  citizenId?: string;
  agencyId?: number;
  agencyName?: string;
  wardCode?: string | null;
  districtCode?: string | null;
  provinceCode?: string;
  address?: string;
  mainPhone?: string;
  subPhone?: string | null;
  fax?: string | null;
  birthday?: string;
  config?: {
    enableLogInService?: boolean;
    enableLogOutService?: boolean;
    enableAuthorizationService?: boolean;
  }[];
  userPermissionConfig?: any[];
  isActive?: boolean;
  isDeleted?: boolean;
  iocRoles?: {
    roleId?: number;
    name?: string;
    code?: string;
    type?: string;
  }[];
  iocPermissions?: {
    "permissionUIPath": "string",
    "isActive": number,
    "permissionCode": "string"
  }[];
  accessToken?: string;
}