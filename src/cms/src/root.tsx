import * as React from 'react';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from 'components';
import { LocalStorage, useUser } from 'micro-sdk';
import { apiClient, cmsApiClient } from '@/service/config';
import { fetchProfile } from '@/service/profile/change-profile';
import { LoadingProvider } from '@/context/LoadingContext';
import GlobalLoading from '@/ui/GlobalLoading';
interface RootProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

export function Root({ children }: RootProps): React.JSX.Element {
  
  // const { url } = useAppProps();
  const { setUser } = useUser();
  useEffect(() => {
    const token = LocalStorage.getToken?.();
    if (token) {
      try {
        apiClient.setAccessToken(token);
        cmsApiClient.setAccessToken(token);
        (async () => {
          try {
            const profile = await fetchProfile();
            if (setUser) {
              setUser({
                accessToken: token,
                id: profile?.id,
                fullName: profile?.fullName,
                userName: profile?.username,
                phoneNumber: profile?.phoneNumber,
                roles: profile?.roles,
              });
            }
          } catch (err) {
            void err;
          }
        })();
      } catch (e) {
        void e;
      }
    }
  }, []);
  // useEffect(() => {
  //   if (url) navigate(url, { replace: true });
  // }, [url]);

  // useEffect(() => {
  //   locale('vi');
  //   addLocale('vi', {
  //     firstDayOfWeek: 1,
  //     emptyMessage: 'Không có dữ liệu',
  //     emptyFilterMessage: 'Không có dữ liệu',
  //     dayNames: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  //     dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  //     dayNamesMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  //     monthNames: [
  //       'Tháng Một',
  //       'Tháng Hai',
  //       'Tháng Ba',
  //       'Tháng Tư',
  //       'Tháng Năm',
  //       'Tháng Sáu',
  //       'Tháng Bảy',
  //       'Tháng Tám',
  //       'Tháng Chín',
  //       'Tháng Mười',
  //       'Tháng Mười Một',
  //       'Tháng Mười Hai',
  //     ],
  //     monthNamesShort: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
  //     today: 'Hôm nay',
  //     weekHeader: 'Tuần',
  //   });
  // }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <ToastProvider>
            {children}
            <GlobalLoading />
          </ToastProvider>
        </LoadingProvider>
      </QueryClientProvider>
    </>
  );
}
