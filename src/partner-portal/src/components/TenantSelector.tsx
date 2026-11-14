import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from 'react-i18next';

import { KeyStorage, PARTNER_PORTAL_CONSTANTS } from '@/constants';
import { CommonStatus, TenantItemModel, UserProfile } from '@/models';
import { LocalStorage } from '@/utils/localStorage';

interface TenantSelectorProps {
  value: string;
  onChange: (tenantId: string) => void;
  showAllOption?: boolean;
  className?: string;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  value,
  onChange,
  showAllOption = false,
  className = '',
}) => {
  const { t } = useTranslation();

  const availableTenants: TenantItemModel[] = React.useMemo(
    () => [
      {
        id: 'TENANT_NATCASH',
        code: 'TENANT_NATCASH',
        name: t('tenant.natcash'),
        shortName: 'Natcash',
        type: t('tenant.type_wallet'),
        country: t('tenant.country_haiti'),
        currency: 'HTG',
        color: '#FF6B00',
        bgColor: 'rgba(255, 107, 0, 0.12)',
        borderColor: 'rgba(255, 107, 0, 0.45)',
        icon: 'pi pi-wallet',
        status: CommonStatus.ACTIVE,
      },
      {
        id: 'TENANT_MICRO_CRM',
        code: 'TENANT_MICRO_CRM',
        name: t('tenant.micro_crm'),
        shortName: 'Micro CRM',
        type: t('tenant.type_retail'),
        country: t('tenant.country_alliance'),
        currency: 'POINT',
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.12)',
        borderColor: 'rgba(59, 130, 246, 0.45)',
        icon: 'pi pi-shopping-bag',
        status: CommonStatus.ACTIVE,
      },
      {
        id: 'TENANT_DELIMART',
        code: 'TENANT_DELIMART',
        name: t('tenant.delimart'),
        shortName: 'Delimart',
        type: t('tenant.type_retail'),
        country: t('tenant.country_haiti'),
        currency: 'HTG',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.45)',
        icon: 'pi pi-shopping-cart',
        status: CommonStatus.ACTIVE,
      },
      {
        id: 'TENANT_NATCOM',
        code: 'TENANT_NATCOM',
        name: t('tenant.natcom'),
        shortName: 'Natcom',
        type: t('tenant.type_telecom'),
        country: t('tenant.country_haiti'),
        currency: 'HTG',
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.12)',
        borderColor: 'rgba(139, 92, 246, 0.45)',
        icon: 'pi pi-wifi',
        status: CommonStatus.ACTIVE,
      },
    ],
    [t]
  );

  const options = React.useMemo(() => {
    const items = availableTenants.map((tenant) => ({
      label: tenant.name,
      value: tenant.code,
      tenant,
    }));
    if (showAllOption) {
      items.unshift({
        label: t('tenant.all_tenants'),
        value: 'ALL',
        tenant: {
          id: 'ALL',
          code: 'ALL',
          name: t('tenant.all_tenants'),
          shortName: 'All',
          type: t('common.all'),
          country: t('tenant.country_global'),
          currency: 'ALL',
          color: '#64748B',
          bgColor: 'rgba(100, 116, 139, 0.12)',
          borderColor: 'rgba(100, 116, 139, 0.4)',
          icon: 'pi pi-globe',
          status: CommonStatus.ACTIVE,
        },
      });
    }
    return items;
  }, [availableTenants, showAllOption, t]);

  const handleChange = (val: string) => {
    LocalStorage.set(KeyStorage.SELECTED_TENANT, val || PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID);
    onChange(val);
  };

  const storedUser = LocalStorage.get<UserProfile>(KeyStorage.USER);
  const lockedTenantId = storedUser?.partnerId && storedUser?.tenantId ? storedUser.tenantId : null;

  React.useEffect(() => {
    if (lockedTenantId && value !== lockedTenantId) {
      LocalStorage.set(KeyStorage.SELECTED_TENANT, lockedTenantId);
      localStorage.setItem('selected_tenant_id', lockedTenantId);
      onChange(lockedTenantId);
    }
  }, [lockedTenantId, value, onChange]);

  if (lockedTenantId) {
    const matchedTenant = availableTenants.find((item) => item.code === lockedTenantId);
    const partnerLabel = storedUser?.partnerName || matchedTenant?.name || lockedTenantId;
    const partnerCodeBadge = storedUser?.partnerCode || lockedTenantId;
    return (
      <div className={`flex align-items-center gap-2 ${className}`}>
        <span className="text-xs font-semibold text-color-secondary hidden sm:inline">
          {t('tenant.select_label')}
        </span>
        <div
          className="flex align-items-center gap-2 px-3 py-2 border-round-md surface-100 border-1 surface-border text-sm"
          title={partnerLabel}
        >
          <i className="pi pi-lock text-xs text-primary" />
          <span className="font-medium text-900">{partnerCodeBadge}</span>
          <span className="text-color-secondary hidden md:inline">· {partnerLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex align-items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-color-secondary hidden sm:inline">
        {t('tenant.select_label')}
      </span>
      <Dropdown
        value={value}
        options={options}
        onChange={(e) => handleChange(e.value)}
        placeholder={t('tenant.placeholder')}
        className="w-16rem"
      />
    </div>
  );
};
