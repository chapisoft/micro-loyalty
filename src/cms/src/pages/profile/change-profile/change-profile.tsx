import { useEffect, useState } from 'react';
import Form from '@/component/Form/Form';
import { useBoolean } from '@/hooks';
import {
  IChangeProfileParams,
  IChangeProfileResponse,
  useChangeProfile,
  useGetProfile,
} from '@/service/profile/change-profile';
import useToastService from '@/service/toast/toast-service.ts';
import CloseModalConfirm from '@/ui/CloseModalConfirm';
import FormField from '@/ui/FormField';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { AppButton, CardLayout } from 'components';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useUser } from 'micro-sdk';

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .nonempty({ message: t('validate.this_field_cannot_be_left_empty') }),
  email: z
    .string()
    .trim()
    .nonempty({ message: t('validate.this_field_cannot_be_left_empty') }),
  phone: z
    .string()
    .trim()
    .nonempty({ message: t('validate.this_field_cannot_be_left_empty') }),
});
const defaultValues: IChangeProfileParams = {
  fullName: '',
  email: '',
  phone: '',
};

export function Page(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToastService();
  const [loading, setLoading] = useState(false);

  const changeProfileMutate = useChangeProfile();
  const { data } = useGetProfile();
  const { user } = useUser();

  const form = useForm<IChangeProfileParams>({
    defaultValues,
    resolver: zodResolver(schema),
    mode: 'all',
  });
  const [visibleConfirm, { on: onVisibleConfirm, off: offVisibleConfirm }] = useBoolean(false);
  const { control, handleSubmit, reset } = form;

  const onSubmit = (formData: IChangeProfileParams) => {
    const dataWithUserId = {
      ...formData,
      userId: user?.id || data?.id, 
    };

    setLoading(true);
    changeProfileMutate.mutate(dataWithUserId, {
      onSuccess: (res: IChangeProfileResponse) => {
        const isSuccess = (res as any)?.status === 0 || (res as any)?.status === 200 || (res as any)?.code === 200 || (res as any)?.succeeded === true;
        if (isSuccess) {
          showToast({
            code: 200,
            detail: res.message || t('update_successful'),
          });
        } else {
          showToast({
            code: 400,
            detail: res.message || t('network_error_please_try_again'),
          });
        }
      },
      onError: (error: AxiosError) => {
        showToast({
          code: 400,
          detail: error.message || t('network_error_please_try_again'),
        });
      },
      onSettled: () => setLoading(false),
    });
  };

  useEffect(() => {
    if (data) {
      reset({
        fullName: data?.fullName || '',
        email: data?.email || '',
        phone: data?.phoneNumber || '',
      });
    }
  }, [data, reset]);

  return (
    <>
      <CardLayout
        cardTitle={t('change-profile')}
        body={
          <Form form={form} onSubmit={handleSubmit(onSubmit)} className="w-full grid">
            <div className="col-12">
              <FormField control={control} name="fullName" label={t('login.fullName')} required />
            </div>
            <div className="col-12">
              <FormField control={control} name="email" label={t('login.email')} required disabled/>
            </div>
            <div className="col-12">
              <FormField control={control} name="phone" label={t('login.phoneNumber')} required disabled/>
            </div>
          </Form>
        }
        footer={
          <div className="flex justify-content-center gap-2 mt-8">
            <AppButton
              variant="close-confirm"
              className="p-button-outlined"
              onClick={() => {
                if (
                  Object.keys(defaultValues).some((key) => {
                    const fieldState = control.getFieldState(key as keyof IChangeProfileParams);
                    return fieldState.isDirty;
                  })
                ) {
                  onVisibleConfirm();
                } else {
                  reset();
                  navigate(-1);
                }
              }}
            />
            <AppButton variant="update" label={t('button.save')} loading={loading} type="submit" onClick={handleSubmit(onSubmit)} />
          </div>
        }
      />
      <CloseModalConfirm
        visible={visibleConfirm}
        rejectAction={offVisibleConfirm}
        acceptAction={() => {
          offVisibleConfirm();
          reset();
          navigate(-1);
        }}
      />
    </>
  );
}
