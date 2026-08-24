import React from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';

export interface TenantOption {
  id: string;
  name: string;
  code: string;
  type: 'WALLET' | 'RETAIL' | 'TELECOM' | 'ENTERTAINMENT' | 'FINANCE';
  icon: string;
  badgeColor: string;
  country: string;
}

export const TENANT_LIST: TenantOption[] = [
  {
    id: 'TENANT_NATCASH',
    name: 'Ví Điện Tử Natcash',
    code: 'NATCASH',
    type: 'WALLET',
    icon: 'pi pi-wallet',
    badgeColor: '#EA580C',
    country: 'Haïti',
  },
  {
    id: 'TENANT_MICRO_CRM',
    name: 'Liên Minh Bán Lẻ Micro-CRM',
    code: 'MICRO_CRM',
    type: 'RETAIL',
    icon: 'pi pi-shopping-bag',
    badgeColor: '#2563EB',
    country: 'Liên Minh',
  },
  {
    id: 'TENANT_DELIMART',
    name: 'Chuỗi Siêu Thị Delimart',
    code: 'DELIMART',
    type: 'RETAIL',
    icon: 'pi pi-shopping-cart',
    badgeColor: '#059669',
    country: 'Haïti',
  },
  {
    id: 'TENANT_NATCOM',
    name: 'Viễn Thông Natcom Telecom',
    code: 'NATCOM',
    type: 'TELECOM',
    icon: 'pi pi-phone',
    badgeColor: '#0284C7',
    country: 'Haïti',
  },
  {
    id: 'TENANT_RINGME',
    name: 'Giải Trí Số Ringme OTT',
    code: 'RINGME',
    type: 'ENTERTAINMENT',
    icon: 'pi pi-play',
    badgeColor: '#7C3AED',
    country: 'Toàn Cầu',
  },
  {
    id: 'TENANT_FINANCE_COOP',
    name: 'Tài Chính & Hợp Tác Xã',
    code: 'FIN_COOP',
    type: 'FINANCE',
    icon: 'pi pi-building',
    badgeColor: '#D97706',
    country: 'Haïti',
  },
];

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
  const selectedOption = TENANT_LIST.find((t) => t.id === value) || TENANT_LIST[0];

  const valueTemplate = (option: TenantOption) => {
    if (!option) return <span>Chọn đối tác...</span>;
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
        Đối tác:
      </span>
      <Dropdown
        value={selectedOption}
        options={TENANT_LIST}
        onChange={(e: DropdownChangeEvent) => onChange(e.value.id)}
        optionLabel="name"
        valueTemplate={valueTemplate}
        itemTemplate={itemTemplate}
        filter
        filterBy="name,code,country"
        placeholder="Chọn đối tác thuê bao..."
        className="w-full md:w-20rem shadow-1 border-round-xl"
        panelClassName="border-round-xl shadow-4"
        style={{ minWidth: '16rem' }}
      />
    </div>
  );
};

export default TenantSelector;
