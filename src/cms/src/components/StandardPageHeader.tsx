import React from 'react';
import { Button } from 'primereact/button';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from './TenantSelector';

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
  const allSecondaryActions = [
    ...(secondaryActions || []),
    ...(extraActions || []),
  ];

  const hasActionProps = Boolean(
    primaryAction || allSecondaryActions.length > 0 || onRefresh
  );

  return (
    <div className={`standard-page-header flex flex-column gap-2 mb-3 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <AppBreadcrumb items={breadcrumbs} />
      )}
      <div className="flex flex-wrap align-items-center justify-content-between gap-3 w-full">
        <div className="flex align-items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-900 m-0 line-height-2 tracking-tight">
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
