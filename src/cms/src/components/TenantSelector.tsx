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
      <div className="flex align-items-center gap-2">
        <div
          className="flex align-items-center justify-content-center border-round-md text-white font-bold"
          style={{ width: '1.5rem', height: '1.5rem', backgroundColor: option.badgeColor, fontSize: '10px' }}
        >
          <i className={option.icon} style={{ fontSize: '11px' }} />
        </div>
        <span className="font-bold text-900" style={{ fontSize: '13px' }}>
          {option.name}
        </span>
        <Tag value={option.code} severity="info" style={{ fontSize: '10px', padding: '2px 6px' }} />
      </div>
    );
  };

  const itemTemplate = (option: TenantOption) => {
    return (
      <div className="flex align-items-center justify-content-between py-1" style={{ width: '100%' }}>
        <div className="flex align-items-center gap-2.5">
          <div
            className="flex align-items-center justify-content-center border-round-lg text-white"
            style={{ width: '2rem', height: '2rem', backgroundColor: option.badgeColor }}
          >
            <i className={option.icon} style={{ fontSize: '13px' }} />
          </div>
          <div>
            <div className="font-bold text-900" style={{ fontSize: '13px' }}>
              {option.name}
            </div>
            <div className="text-500 text-xs">{option.country}</div>
          </div>
        </div>
        <Tag value={option.code} severity="secondary" style={{ fontSize: '10px', padding: '2px 6px' }} />
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
        className="w-full md:w-20rem shadow-1 border-round-xl"
        panelClassName="border-round-xl shadow-4"
        style={{ minWidth: '16rem' }}
      />
    </div>
  );
};

export default TenantSelector;
