import React, { useMemo } from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { useTranslation } from 'react-i18next';
import i18n from '@/language';

export interface TenantOption {
  id: string;
  name: string;
  code: string;
  type: 'WALLET' | 'RETAIL' | 'TELECOM' | 'ENTERTAINMENT' | 'FINANCE';
  icon: string;
  badgeColor: string;
  country: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const RAW_TENANTS = [
  {
    id: 'TENANT_NATCASH',
    code: 'NATCASH',
    translationKey: 'natcash',
    type: 'WALLET' as const,
    icon: 'pi pi-wallet',
    badgeColor: '#EA580C',
    countryKey: 'haiti',
  },
  {
    id: 'TENANT_MICRO_CRM',
    code: 'MICRO_CRM',
    translationKey: 'micro_crm',
    type: 'RETAIL' as const,
    icon: 'pi pi-shopping-bag',
    badgeColor: '#2563EB',
    countryKey: 'alliance',
  },
  {
    id: 'TENANT_DELIMART',
    code: 'DELIMART',
    translationKey: 'delimart',
    type: 'RETAIL' as const,
    icon: 'pi pi-shopping-cart',
    badgeColor: '#059669',
    countryKey: 'haiti',
  },
  {
    id: 'TENANT_NATCOM',
    code: 'NATCOM',
    translationKey: 'natcom',
    type: 'TELECOM' as const,
    icon: 'pi pi-phone',
    badgeColor: '#0284C7',
    countryKey: 'haiti',
  },
  {
    id: 'TENANT_RINGME',
    code: 'RINGME',
    translationKey: 'ringme',
    type: 'ENTERTAINMENT' as const,
    icon: 'pi pi-play',
    badgeColor: '#7C3AED',
    countryKey: 'global',
  },
  {
    id: 'TENANT_FINANCE_COOP',
    code: 'FIN_COOP',
    translationKey: 'fin_coop',
    type: 'FINANCE' as const,
    icon: 'pi pi-building',
    badgeColor: '#D97706',
    countryKey: 'haiti',
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export const TENANT_LIST: TenantOption[] = [
  {
    id: 'ALL',
    name: i18n.t('tenant.all_tenants', 'Tất cả đối tác'),
    code: 'ALL',
    type: 'RETAIL',
    icon: '',
    badgeColor: '',
    country: '',
  },
  ...RAW_TENANTS.map((item) => ({
    id: item.id,
    name: i18n.t(`tenant.${item.translationKey}`),
    code: item.code,
    type: item.type,
    icon: item.icon,
    badgeColor: item.badgeColor,
    country: i18n.t(`tenant.country_${item.countryKey}`),
  })),
];

interface TenantSelectorProps {
  value?: string;
  onChange?: (tenantId: string) => void;
  selectedTenant?: string;
  onTenantChange?: (tenantId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  value,
  onChange,
  selectedTenant,
  onTenantChange,
  className = '',
  style,
}) => {
  const { t } = useTranslation();

  const effectiveTenantId = value || selectedTenant || 'ALL';

  const handleSelect = (newId: string) => {
    if (typeof onChange === 'function') {
      onChange(newId);
    }
    if (typeof onTenantChange === 'function') {
      onTenantChange(newId);
    }
  };

  const localizedTenants = useMemo<TenantOption[]>(() => {
    return [
      {
        id: 'ALL',
        name: t('tenant.all_tenants', 'Tất cả đối tác'),
        code: 'ALL',
        type: 'RETAIL' as const,
        icon: '',
        badgeColor: '',
        country: '',
      },
      ...RAW_TENANTS.map((item) => ({
        id: item.id,
        name: t(`tenant.${item.translationKey}`),
        code: item.code,
        type: item.type,
        icon: item.icon,
        badgeColor: item.badgeColor,
        country: t(`tenant.country_${item.countryKey}`),
      })),
    ];
  }, [t]);

  const selectedOption =
    localizedTenants.find((tOpt) => tOpt.id === effectiveTenantId) || localizedTenants[0];

  const valueTemplate = (option: TenantOption) => {
    if (!option) return <span className="text-500">{t('tenant.choose_partner', 'Chọn đối tác...')}</span>;
    return (
      <span
        className="font-medium text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis"
        style={{ fontSize: '13px' }}
      >
        {option.name}
      </span>
    );
  };

  const itemTemplate = (option: TenantOption) => {
    return (
      <div className="py-1 px-2" style={{ width: '100%' }}>
        <span className="font-medium text-900 text-sm">{option.name}</span>
      </div>
    );
  };

  return (
    <div className={`flex align-items-center gap-2 ${className}`} style={style}>
      <span className="text-500 font-semibold text-xs white-space-nowrap hidden sm:inline">
        {t('tenant.select_label')}
      </span>
      <Dropdown
        value={selectedOption}
        options={localizedTenants}
        onChange={(e: DropdownChangeEvent) => {
          const selectedId = e.value?.id || (typeof e.value === 'string' ? e.value : null);
          if (selectedId) {
            handleSelect(selectedId);
          }
        }}
        optionLabel="name"
        valueTemplate={valueTemplate}
        itemTemplate={itemTemplate}
        placeholder={t('tenant.placeholder')}
        className="p-inputtext-sm shadow-1 border-round-lg"
        style={{ minWidth: '13rem', maxWidth: '17rem' }}
        appendTo="self"
      />
    </div>
  );
};

export default TenantSelector;
