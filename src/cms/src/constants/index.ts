const origin = typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : '';
const defaultApiUrl = 'https://api.mid.io.vn';
const defaultAuthUrl = 'https://cms.mid.io.vn';

export const envVariables = {
  MODE: window.__ENV__?.VITE_MODE ?? import.meta.env.VITE_MODE ?? 'production',
  API_URL: window.__ENV__?.VITE_API_URL || import.meta.env.VITE_API_URL || defaultApiUrl,
  API_AUTH_URL: window.__ENV__?.VITE_API_AUTH_URL || import.meta.env.VITE_API_AUTH_URL || defaultAuthUrl,
  CMS_URL: window.__ENV__?.VITE_API_AUTH_URL || import.meta.env.VITE_API_AUTH_URL || defaultAuthUrl,
  ACCESS_TOKEN: window.__ENV__?.VITE_ACCESS_TOKEN ?? import.meta.env.VITE_ACCESS_TOKEN ?? '',
  CONTEXT_PATH: window.__ENV__?.VITE_CONTEXT_PATH ?? import.meta.env.VITE_CONTEXT_PATH ?? '/',
  IMAGE_URL: window.__ENV__?.VITE_IMAGE_URL || import.meta.env.VITE_IMAGE_URL || (origin ? `${origin}/` : 'https://cms.mid.io.vn/'),
};


export enum DateFormat {
  DATE = 'DD/MM/YYYY',
  DATE_TIME = 'DD/MM/YYYY HH:mm',
  TIME_DATE = 'HH:mm DD/MM/YYYY',
  FULL_TIME_DATE = 'HH:mm:ss DD/MM/YYYY',
  TIME = 'HH:mm',
  DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss',
  FULL_TIME_DATE_2 = 'DD/MM/YYYY HH:mm:ss',
  DATE_FORMAT = 'YYYY-MM-DD',
  API_DATE = 'YYYYMMDD'
}

export enum MutationKey {
  // Auth
  LOG_IN = 'LOG_IN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  REGISTER_ACCOUNT = 'REGISTER_ACCOUNT',
  LOG_IN_OTP = 'LOGIN_OTP',
  RESET_PASSWORD = 'RESET_PASSWORD',  
  RESEND_OTP = 'RESEND_OTP',

  // Profile
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  CHANGE_PROFILE = 'CHANGE_PROFILE',

  // Admin - Users
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  LOCK_USER = 'LOCK_USER',
  UNLOCK_USER = 'UNLOCK_USER',

  // Admin - Roles
  CREATE_ROLE = 'CREATE_ROLE',
  UPDATE_ROLE = 'UPDATE_ROLE',
  DELETE_ROLE = 'DELETE_ROLE',
}

export enum QueryKey {
  // Dashboard
  GET_DASHBOARD_ANALYSIS = 'GET_DASHBOARD_ANALYSIS',
  GET_DASHBOARD_WORKPLACE = 'GET_DASHBOARD_WORKPLACE',

  // Profile
  GET_PROFILE = 'GET_PROFILE',

  // Admin - Users
  GET_ALL_USERS = 'GET_ALL_USERS',
  GET_USER_DETAIL = 'GET_USER_DETAIL',

  // Admin - Roles
  GET_ALL_ROLES = 'GET_ALL_ROLES',
  GET_ROLE_DETAIL = 'GET_ROLE_DETAIL',
}

export enum FieldType {
  TEXTAREA = 'textarea',
  FILE = 'file',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CALENDAR = 'calendar',
  TEXT = 'text',
  NUMBER = 'number',
  RADIO = 'radio',
  EDITOR = 'editor',
  TREE_SELECT = 'tree_select',
  AUTOCOMPLETE = 'autocomplete',
}

export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DETAIL = 'detail',
}

export interface ICombobox {
  name: string;
  value: any;
  color?: string;
}

export enum ELanguages {
  VI = 'vi',
  EN = 'en',
  FR = 'fr',
  ZH = 'zh',
  JA = 'ja',
  KO = 'ko',
  HT = 'ht',
}

export const DEFAULT_PAGE_SIZE = 50;

export const STATUS = {
  NEW:      0,
  ACTIVE:   1,
  PENDING:  2,
  REJECTED: -1,
  LOCKED:   -2,
} as const;

export type StatusValue = typeof STATUS[keyof typeof STATUS];