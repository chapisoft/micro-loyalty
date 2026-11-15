import React, { useState, useRef, useEffect } from 'react';
import { IUser } from '@/service/admin/admin';

interface UserRoleCellProps {
  user: IUser;
  onOpenRoleModal: (user: IUser) => void;
}

export const UserRoleCell: React.FC<UserRoleCellProps> = ({ user, onOpenRoleModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const rolesList = user.roles || [];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (rolesList.length === 0) {
    return (
      <span
        onClick={() => onOpenRoleModal(user)}
        className="text-xs text-400 cursor-pointer hover:underline"
        title="Nhấp để gán vai trò"
      >
        Chưa phân quyền
      </span>
    );
  }

  const getBadgeStyle = (code: string) => {
    const c = code.toUpperCase();
    if (c.includes('ADMIN')) {
      return { bg: '#FEF2F2', text: '#B42318', border: '#FECDCA' };
    }
    if (c.includes('PARTNER')) {
      return { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' };
    }
    if (c.includes('FINANCE') || c.includes('CLEARING')) {
      return { bg: '#F0FDF4', text: '#15803D', border: '#DCFCE7' };
    }
    return { bg: '#EEF2FF', text: '#4F46E5', border: '#E0E7FF' };
  };

  const visibleRoles = rolesList.slice(0, 2);
  const remainingCount = rolesList.length - visibleRoles.length;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div className="flex align-items-center gap-1 flex-nowrap">
        {visibleRoles.map((r) => {
          const s = getBadgeStyle(r.code);
          return (
            <span
              key={r.roleId || r.code}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 500,
                background: s.bg,
                color: s.text,
                border: `1px solid ${s.border}`,
                whiteSpace: 'nowrap',
              }}
              title={r.description || r.name}
            >
              {r.name || r.code}
            </span>
          );
        })}

        {remainingCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            title="Xem tất cả vai trò"
            style={{
              padding: '2px 7px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              background: isOpen ? '#E2E8F0' : '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            +{remainingCount}
          </button>
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 999,
            width: '280px',
            background: '#FFFFFF',
            borderRadius: '10px',
            padding: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E2E8F0',
          }}
        >
          <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 surface-border">
            <span className="text-xs font-bold text-900">
              Danh sách vai trò ({rolesList.length})
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="border-none bg-transparent cursor-pointer text-400 p-0 text-sm hover:text-600"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-column gap-1 max-h-12rem overflow-y-auto">
            {rolesList.map((r) => {
              const s = getBadgeStyle(r.code);
              return (
                <div
                  key={r.roleId || r.code}
                  className="flex align-items-center gap-2 p-1 border-round surface-50"
                >
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: s.bg,
                      color: s.text,
                      border: `1px solid ${s.border}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.code}
                  </span>
                  <span className="text-xs text-700 font-medium overflow-hidden text-overflow-ellipsis white-space-nowrap">
                    {r.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-top-1 surface-border">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenRoleModal(user);
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #DBEAFE',
                background: '#EFF6FF',
                color: '#1D4ED8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Chỉnh sửa phân quyền
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
