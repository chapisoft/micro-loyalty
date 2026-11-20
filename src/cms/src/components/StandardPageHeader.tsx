import React from 'react';
import { Button } from 'primereact/button';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { TenantSelector } from './TenantSelector';

// Nhóm menu theo tiền tố đường dẫn — breadcrumb Figma luôn là "Nhóm menu / Tên trang"
const NAV_GROUPS: [RegExp, string][] = [
  [/^\/(tiers|policies|campaigns|customers|engagement)/, 'nav.loyalty_policies'],
  [/^\/(vouchers|games)/, 'nav.rewards_games'],
  [/^\/(partners|transactions|clearing|agents)/, 'nav.partner_network'],
  [/^\/reports/, 'nav.reports_budget'],
  [/^\/(admin|categories|system-parameters)/, 'nav.admin'],
];

export interface StandardPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; url?: string; to?: string }[];
  tenantValue?: string;
  onTenantChange?: (tenantId: string) => void;
  primaryAction?: {
    label: string;
    icon?: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    severity?: any;
  };
  secondaryActions?: {
    label: string;
    icon?: string;
    onClick: () => void;
    outlined?: boolean;
    severity?: any;
    loading?: boolean;
    disabled?: boolean;
  }[];
  extraActions?: {
    label: string;
    icon?: string;
    onClick: () => void;
    outlined?: boolean;
    severity?: any;
    loading?: boolean;
    disabled?: boolean;
  }[];
  extraLeft?: React.ReactNode;
  onRefresh?: () => void;
  refreshLoading?: boolean;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const StandardPageHeader: React.FC<StandardPageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  tenantValue,
  onTenantChange,
  primaryAction,
  secondaryActions,
  extraActions,
  extraLeft,
  onRefresh,
  refreshLoading = false,
  actions,
  badge,
  className = '',
}) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const groupKey = NAV_GROUPS.find(([re]) => re.test(pathname))?.[1];
  const crumbs = groupKey
    ? [t(groupKey), title]
    : (breadcrumbs || []).map((b) => b.label);

  const allSecondaryActions = [
    ...(secondaryActions || []),
    ...(extraActions || []),
  ];

  const hasActionProps = Boolean(
    primaryAction || allSecondaryActions.length > 0 || onRefresh
  );

  return (
    <div className={`standard-page-header flex flex-column gap-2 mb-3 ${className}`}>
      {crumbs.length > 0 && (
        <div className="fg-breadcrumb">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="fg-breadcrumb-sep">/</span>}
              <span>{c}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex flex-wrap align-items-center justify-content-between gap-3 w-full">
        <div className="flex align-items-center gap-2">
          <h1 className="fg-page-title">
            {title}
          </h1>
          {badge}
          {subtitle && (
            <span className="hidden md:inline text-xs text-500 font-normal pl-2 border-left-1 surface-border">
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex align-items-center gap-2 ml-auto">
          {tenantValue !== undefined && onTenantChange && (
            <TenantSelector value={tenantValue} onChange={onTenantChange} />
          )}

          {extraLeft}

          {actions}

          {hasActionProps && (
            <>
              {allSecondaryActions.map((sec, idx) => (
                <Button
                  key={idx}
                  type="button"
                  label={sec.label}
                  icon={sec.icon}
                  outlined={sec.outlined !== false}
                  severity={sec.severity === 'primary' ? undefined : (sec.severity || 'secondary')}
                  size="small"
                  onClick={sec.onClick}
                  loading={sec.loading}
                  disabled={sec.disabled}
                  className="p-button-sm font-medium"
                />
              ))}

              {primaryAction && (
                <Button
                  type="button"
                  label={primaryAction.label}
                  icon={primaryAction.icon || 'pi pi-plus'}
                  severity={primaryAction.severity === 'primary' ? undefined : primaryAction.severity}
                  size="small"
                  onClick={primaryAction.onClick}
                  loading={primaryAction.loading}
                  disabled={primaryAction.disabled}
                  className="p-button-sm font-medium"
                />
              )}

              {onRefresh && (
                <Button
                  type="button"
                  icon="pi pi-refresh"
                  outlined
                  rounded
                  size="small"
                  onClick={onRefresh}
                  loading={refreshLoading}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
