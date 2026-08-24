import { ICombobox } from '@/constants';
import { STATUS } from '@/constants';
import { useTranslation } from 'react-i18next';

const useOptions = () => {
  const { t } = useTranslation();

  const statusOptions: ICombobox[] = [
    { name: t('pending'), value: 0 },
    { name: t('failed'), value: -1 },
    { name: t('successed'), value: 1 },
    { name: t('blocked'), value: 2 },
    { name: t('timeout'), value: 5 },
    { name: t('canceled'), value: -2 },
  ];

  const activityStatusOptions: ICombobox[] = [
    { name: 'PENDING', value: 'PENDING' },
    { name: 'COMPLETED', value: 'COMPLETED' },
    { name: 'PAID', value: 'PAID' },
    { name: 'REJECTED', value: 'REJECTED' },
    { name: 'FAILED', value: 'FAILED' },
    { name: 'PARTIALLY_REFUNDED', value: 'PARTIALLY_REFUNDED' }
  ];

  /** Merchant & QR Code status options using standardized STATUS constants */
  const merchantStatusOptions: ICombobox[] = [
    { name: t('active'),   value: STATUS.ACTIVE },
    { name: t('pending'),  value: STATUS.PENDING },
    { name: t('rejected'), value: STATUS.REJECTED },
    { name: t('locked'),   value: STATUS.LOCKED },
  ];

  const qrStatusOptions: ICombobox[] = [
    { name: t('new'),      value: STATUS.NEW },
    { name: t('active'),   value: STATUS.ACTIVE },
    { name: t('pending'),  value: STATUS.PENDING },
    { name: t('rejected'), value: STATUS.REJECTED },
    { name: t('locked'),   value: STATUS.LOCKED },
  ];

  const qrCreateOptions: ICombobox[] = [
    { name: t('single'), value: "SINGLE" },
    { name: t('batch'), value: "BATCH" },
  ];

  const qrTypeOptions: ICombobox[] = [
    { name: t('static'), value: "STATIC" },
    { name: t('dynamic'), value: "DYNAMIC" },
  ];

  const branchOptions: ICombobox[] = [
    { name: 'ART', value: 'ART' },
    { name: 'CEN', value: 'CEN' },
    { name: 'NOR', value: 'NOR' },
    { name: 'NOT', value: 'NOT' },
    { name: 'OU1', value: 'OU1' },
    { name: 'OU2', value: 'OU2' },
    { name: 'OU3', value: 'OU3' },
    { name: 'SUD', value: 'SUD' },
  ];

  return {
    statusOptions,
    activityStatusOptions,
    merchantStatusOptions,
    qrCreateOptions,
    qrTypeOptions,
    qrStatusOptions,
    branchOptions,
  };
};

export default useOptions;
