import { envVariables } from '@/constants';
import { Mode, ApiClient } from 'micro-sdk';

export const apiClient = new ApiClient(envVariables.API_URL, envVariables.MODE as Mode);
export const apiAuthClient = new ApiClient(envVariables.API_AUTH_URL, envVariables.MODE as Mode);
export const cmsApiClient = new ApiClient(envVariables.CMS_URL, envVariables.MODE as Mode);


