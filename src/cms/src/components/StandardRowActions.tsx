import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { useTranslation } from 'react-i18next';

export interface RowActionItem {
  id?: string;
  label: string;
  icon: string;
  severity?: 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help';
  onClick: (e?: React.MouseEvent) => void;
  danger?: boolean;
  disabled?: boolean;
  visible?: boolean;
  className?: string;
}

export interface StandardRowActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  actions?: RowActionItem[];
  extraActions?: RowActionItem[];
  maxInline?: number; // Defaults to 3
  className?: string;
}

export const StandardRowActions: React.FC<StandardRowActionsProps> = ({
  onEdit,
  onDelete,
  onView,
  actions = [],
  extraActions = [],
  maxInline = 3,
  className = '',
}) => {
  const { t } = useTranslation();
  const menuRef = useRef<Menu>(null);

  const builtActions: RowActionItem[] = [];

  if (onView) {
    builtActions.push({
      id: 'view',
      icon: 'pi pi-eye',
      label: t('common.view', 'Xem chi tiết'),
      severity: 'info',
      onClick: onView,
    });
  }

  if (onEdit) {
    builtActions.push({
      id: 'edit',
      icon: 'pi pi-pencil',
      label: t('common.edit', 'Chỉnh sửa'),
      severity: 'info',
      onClick: onEdit,
    });
  }

  if (onDelete) {
    builtActions.push({
      id: 'delete',
      icon: 'pi pi-trash',
      label: t('common.delete', 'Xóa'),
      severity: 'danger',
      danger: true,
      onClick: onDelete,
    });
  }

  const allActions = [...builtActions, ...actions, ...extraActions];
  const visibleActions = allActions.filter((a) => a.visible !== false);

  if (visibleActions.length === 0) {
    return null;
  }

  // If actions <= maxInline: display all directly
  if (visibleActions.length <= maxInline) {
    return (
      <div className={`flex align-items-center gap-1 ${className}`}>
        {visibleActions.map((action, idx) => (
          <Button
            key={action.id || idx}
            type="button"
            icon={action.icon}
            rounded
            text
            size="small"
            severity={action.danger ? 'danger' : action.severity || 'secondary'}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(e);
            }}
            disabled={action.disabled}
            tooltip={action.label}
            tooltipOptions={{ position: 'top' }}
            className={`p-button-sm ${action.className || ''}`}
          />
        ))}
      </div>
    );
  }

  // If actions > maxInline: display first (maxInline - 1) buttons, collapse the rest into an overflow menu
  const inlineActions = visibleActions.slice(0, maxInline - 1);
  const overflowActions = visibleActions.slice(maxInline - 1);

  const overflowMenuItems: MenuItem[] = overflowActions.map((action, idx) => ({
    id: action.id || String(idx),
    label: action.label,
    icon: action.icon,
    className: action.danger ? 'text-red-500' : '',
    disabled: action.disabled,
    command: () => action.onClick(),
  }));

  return (
    <div className={`flex align-items-center gap-1 ${className}`}>
      {inlineActions.map((action, idx) => (
        <Button
          key={action.id || idx}
          type="button"
          icon={action.icon}
          rounded
          text
          size="small"
          severity={action.danger ? 'danger' : action.severity || 'secondary'}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick(e);
          }}
          disabled={action.disabled}
          tooltip={action.label}
          tooltipOptions={{ position: 'top' }}
          className={`p-button-sm ${action.className || ''}`}
        />
      ))}

      <Menu model={overflowMenuItems} popup ref={menuRef} />
      <Button
        type="button"
        icon="pi pi-ellipsis-v"
        rounded
        text
        size="small"
        severity="secondary"
        onClick={(e) => {
          e.stopPropagation();
          menuRef.current?.toggle(e);
        }}
        tooltip={t('common.more_actions', 'Hành động khác')}
        tooltipOptions={{ position: 'top' }}
        className="p-button-sm"
      />
    </div>
  );
};
