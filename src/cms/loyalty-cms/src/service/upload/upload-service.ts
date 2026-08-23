import { useMutation } from '@tanstack/react-query';

import { apiClient } from '../config';

export enum UploadType {
  OTHER = 0,
  PRODUCT = 1,
  CATEGORY = 2,
  NEWS = 3,
  NOTI = 4,
  USER = 5,
}

export interface IUploadFormParams {
  uploadType: UploadType;
  file: File;
}

export interface IUploadFormResponse {
  time?: string
  statusCode?: number
  code?: number
  succeeded?: boolean
  message?: string
  data?: string
}

const headers = {
  'Content-Type': 'multipart/form-data',
};

const uploadForm = (params: IUploadFormParams): Promise<IUploadFormResponse> => {
  const formData = new FormData();
  formData.append('uploadType', params.uploadType.toString());
  formData.append('file', params.file);

  return apiClient.post('sv2/v1/upload/save', formData, {
    headers,
  });
};

const useUploadService = () => {
  const useUploadForm = ({
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: IUploadFormResponse) => void;
    onError?: () => void;
  }) => {
    return useMutation({
      mutationFn: (params: IUploadFormParams) => uploadForm(params),
      onSuccess,
      onError,
    });
  };

  return {
    useUploadForm,
  };
};

export { useUploadService };
