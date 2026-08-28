import React, { useMemo } from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { useTranslation } from 'react-i18next';

export interface TenantOption {
  id: string;
  name: string;
  code: string;
  type: 'WALLET' | 'RETAIL' | 'TELECOM' | 'ENTERTAINMENT' | 'FINANCE';
  icon: string;
  badgeColor: string;
  country: string;
}

export const RAW_TENANTS = [
  {
    id: 'TENANT_NATCASH',
    code: 'NATCASH',
    translationKey: 'natcash',
    defaultName: 'Ví Điện Tử Natcash',
    type: 'WALLET' as const,
    icon: 'pi pi-wallet',
    badgeColor: '#EA580C',
    countryKey: 'haiti',
    defaultCountry: 'Haïti',
  },
  {
    id: 'TENANT_MICRO_CRM',
    code: 'MICRO_CRM',
    translationKey: 'micro_crm',
    defaultName: 'Liên Minh Bán Lẻ Micro-CRM',
    type: 'RETAIL' as const,
    icon: 'pi pi-shopping-bag',
    badgeColor: '#2563EB',
    countryKey: 'alliance',
    defaultCountry: 'Liên Minh',
  },
  {
    id: 'TENANT_DELIMART',
    code: 'DELIMART',
    translationKey: 'delimart',
    defaultName: 'Chuỗi Siêu Thị Delimart',
    type: 'RETAIL' as const,
    icon: 'pi pi-shopping-cart',
    badgeColor: '#059669',
    countryKey: 'haiti',
    defaultCountry: 'Haïti',
  },
  {
    id: 'TENANT_NATCOM',
    code: 'NATCOM',
    translationKey: 'natcom',
    defaultName: 'Viễn Thông Natcom Telecom',
    type: 'TELECOM' as const,
    icon: 'pi pi-phone',
    badgeColor: '#0284C7',
    countryKey: 'haiti',
    defaultCountry: 'Haïti',
  },
  {
    id: 'TENANT_RINGME',
    code: 'RINGME',
    translationKey: 'ringme',
    defaultName: 'Giải Trí Số Ringme OTT',
    type: 'ENTERTAINMENT' as const,
    icon: 'pi pi-play',
    badgeColor: '#7C3AED',
    countryKey: 'global',
    defaultCountry: 'Toàn Cầu',
  },
  {
    id: 'TENANT_FINANCE_COOP',
    code: 'FIN_COOP',
    translationKey: 'fin_coop',
    defaultName: 'Tài Chính & Hợp Tác Xã',
    type: 'FINANCE' as const,
    icon: 'pi pi-building',
    badgeColor: '#D97706',
    countryKey: 'haiti',
    defaultCountry: 'Haïti',
  },
];

export const TENANT_LIST: TenantOption[] = RAW_TENANTS.map((t) => ({
  id: t.id,
  name: t.defaultName,
  code: t.code,
  type: t.type,
  icon: t.icon,
  badgeColor: t.badgeColor,
  country: t.defaultCountry,
}));

interface TenantSelectorProps {
  value: string;
  onChange: (tenantId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  value,
  onChange,
  className = '',
  style,
}) => {
  const { t } = useTranslation();

  const localizedTenants = useMemo<TenantOption[]>(() => {
    return RAW_TENANTS.map((item) => ({
      id: item.id,
      name: t(`tenant.${item.translationKey}`, { defaultValue: item.defaultName }),
      code: item.code,
      type: item.type,
      icon: item.icon,
      badgeColor: item.badgeColor,
      country: t(`tenant.country_${item.countryKey}`, { defaultValue: item.defaultCountry }),
    }));
  }, [t]);

  const selectedOption = localizedTenants.find((tOpt) => tOpt.id === value) || localizedTenants[0];

  const valueTemplate = (option: TenantOption) => {
    if (!option) return <span>{t('tenant.choose_partner', { defaultValue: 'Chọn đối tác...' })}</span>;
    return (
      <div className="flex align-items-center" style={{ gap: '8px', minWidth: 0, width: '100%' }}>
        <div
          className="flex align-items-center justify-content-center text-white font-bold flex-shrink-0"
          style={{
            width: '22px',
            height: '22px',
            minWidth: '22px',
            minHeight: '22px',
            backgroundColor: option.badgeColor,
            borderRadius: '6px',
            flexShrink: 0,
          }}
        >
          <i className={option.icon} style={{ fontSize: '11px' }} />
        </div>
        <span
          className="font-bold text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis"
          style={{ fontSize: '13px', flex: '1 1 auto', minWidth: 0 }}
        >
          {option.name}
        </span>
        <Tag
          value={option.code}
          severity="info"
          className="flex-shrink-0"
          style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}
        />
      </div>
    );
  };

  const itemTemplate = (option: TenantOption) => {
    return (
      <div className="flex align-items-center justify-content-between py-1 px-1" style={{ width: '100%', gap: '12px' }}>
        <div className="flex align-items-center" style={{ gap: '12px', minWidth: 0 }}>
          <div
            className="flex align-items-center justify-content-center text-white flex-shrink-0"
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              minHeight: '32px',
              backgroundColor: option.badgeColor,
              borderRadius: '8px',
              flexShrink: 0,
            }}
          >
            <i className={option.icon} style={{ fontSize: '14px' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="font-bold text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis" style={{ fontSize: '13px' }}>
              {option.name}
            </div>
            <div className="text-500 text-xs mt-1">{option.country}</div>
          </div>
        </div>
        <Tag
          value={option.code}
          severity="secondary"
          className="flex-shrink-0"
          style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}
        />
      </div>
    );
  };

  return (
    <div className={`flex align-items-center gap-2 ${className}`} style={style}>
      <span className="text-500 font-semibold text-xs white-space-nowrap hidden sm:inline">
        <i className="pi pi-building mr-1 text-primary" />
        {t('tenant.select_label', { defaultValue: 'Đối tác:' })}
      </span>
      <Dropdown
        value={selectedOption}
        options={localizedTenants}
        onChange={(e: DropdownChangeEvent) => onChange(e.value.id)}
        optionLabel="name"
        valueTemplate={valueTemplate}
        itemTemplate={itemTemplate}
        filter
        filterBy="name,code,country"
        placeholder={t('tenant.placeholder', { defaultValue: 'Chọn đối tác thuê bao...' })}
        className="w-full shadow-1 border-round-xl"
        panelClassName="border-round-xl shadow-4"
        style={{ minWidth: '19rem', maxWidth: '25rem' }}
      />
    </div>
  );
};

export default TenantSelector;
