import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Sidebar } from 'primereact/sidebar';
import { Skeleton } from 'primereact/skeleton';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import {
  LoyaltyService,
  MemberProfile360Model,
  PointExpirationBucketModel,
} from '@/service/loyalty.service';
import { apiClient } from '@/service/config';
import { CommonStatus, MemberAccountStatus, TierLevel } from '@/models';

export interface LoyaltyMemberAccount {
  id: number;
  externalUserId: string;
  phoneNumber: string;
  fullName: string;
  currentPoints: number;
  tierPoints: number;
  tier?: {
    code: string;
    name: string;
    pointMultiplier: number;
  };
  status: string;
  createdAt: string;
}

export const Customers: React.FC = () => {
  const { t } = useTranslation();
  const toastRef = useRef<Toast>(null);

  const [items, setItems] = useState<LoyaltyMemberAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );

  // HV-08 Member 360 Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LoyaltyMemberAccount | null>(null);
  const [profile360, setProfile360] = useState<MemberProfile360Model | null>(null);
  const [fifoBuckets, setFifoBuckets] = useState<PointExpirationBucketModel[]>([]);

  // HV-09 Lock/Unlock Dialog state (Maker-Checker 2-layer approval)
  const [lockDialogVisible, setLockDialogVisible] = useState(false);
  const [lockAction, setLockAction] = useState<'LOCK' | 'UNLOCK'>('LOCK');
  const [lockReason, setLockReason] = useState('');
  const [lockTicketRef, setLockTicketRef] = useState('');
  const [lockSubmitting, setLockSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userPhone = searchPhone.trim() || 'CUST_001';
      const response: any = await apiClient.get(
        `/loyalty/v1/profile?externalUserId=${encodeURIComponent(userPhone)}`,
        { headers: { 'X-Tenant-Id': selectedTenant } }
      );
      if (response && response.accountId) {
        setItems([
          {
            id: response.accountId,
            externalUserId: response.externalUserId,
            phoneNumber: response.phoneNumber || response.externalUserId,
            fullName:
              response.fullName ||
              t('customer.default_member', { defaultValue: 'Hội viên Thân thiết' }),
            currentPoints: response.currentPoints || 0,
            tierPoints: response.tierPoints || 0,
            tier: response.tier,
            status: response.status || CommonStatus.ACTIVE,
            createdAt: response.createdAt,
          },
        ]);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error('[Customers.fetchData] Error:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

  const openMember360 = async (member: LoyaltyMemberAccount) => {
    setSelectedMember(member);
    setDrawerVisible(true);
    setDrawerLoading(true);
    setProfile360(null);
    setFifoBuckets([]);
    try {
      const [profileData, bucketsData] = await Promise.all([
        LoyaltyService.getMemberProfile360(member.externalUserId, selectedTenant),
        LoyaltyService.getExpiringBuckets(member.externalUserId, selectedTenant),
      ]);
      setProfile360(profileData);
      setFifoBuckets(
        Array.isArray(bucketsData) && bucketsData.length > 0
          ? bucketsData
          : profileData?.expiringBuckets || []
      );
    } catch (e) {
      console.error('[openMember360] Error:', e);
    } finally {
      setDrawerLoading(false);
    }
  };

  const openLockDialog = (member: LoyaltyMemberAccount) => {
    setSelectedMember(member);
    const isCurrentlyLocked =
      member.status === MemberAccountStatus.LOCKED ||
      member.status === MemberAccountStatus.INACTIVE;
    setLockAction(isCurrentlyLocked ? 'UNLOCK' : 'LOCK');
    setLockReason('');
    setLockTicketRef('');
    setLockDialogVisible(true);
  };

  const handleSubmitLockRequest = async () => {
    if (!selectedMember) return;
    if (!lockReason.trim()) {
      toastRef.current?.show({
        severity: 'warn',
        summary: t('common.warning', { defaultValue: 'Cảnh báo' }),
        detail: t('customer.lock_reason_required', {
          defaultValue: 'Vui lòng nhập lý do khóa hoặc mở khóa hội viên!',
        }),
        life: 3000,
      });
      return;
    }

    setLockSubmitting(true);
    try {
      await LoyaltyService.submitMemberLockRequest(
        selectedMember.externalUserId,
        {
          action: lockAction,
          reason: lockReason.trim(),
          ticketRef: lockTicketRef.trim() || undefined,
        },
        selectedTenant
      );
      toastRef.current?.show({
        severity: 'success',
        summary: t('common.success', { defaultValue: 'Thành công' }),
        detail: t('customer.lock_request_submitted', {
          defaultValue: 'Đã gửi yêu cầu khóa/mở khóa sang hàng đợi phê duyệt 2 lớp!',
        }),
        life: 3500,
      });
      setLockDialogVisible(false);
    } catch (e: any) {
      console.error('[handleSubmitLockRequest] Error:', e);
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail:
          e?.response?.data?.message ||
          e?.message ||
          t('customer.lock_request_failed', {
            defaultValue: 'Không thể gửi yêu cầu phê duyệt khóa/mở khóa!',
          }),
        life: 4000,
      });
    } finally {
      setLockSubmitting(false);
    }
  };

  const tierBadgeTemplate = (rowData: LoyaltyMemberAccount) => {
    const tierCode = rowData.tier?.code || TierLevel.SILVER;
    switch (tierCode) {
      case TierLevel.DIAMOND:
        return (
          <Tag
            severity="info"
            value={rowData.tier?.name || t('tier.tier_diamond', { defaultValue: 'Kim Cương' })}
            icon="pi pi-crown"
          />
        );
      case TierLevel.PLATINUM:
        return (
          <Tag
            severity="info"
            value={rowData.tier?.name || t('tier.tier_platinum', { defaultValue: 'Bạch Kim' })}
            icon="pi pi-crown"
          />
        );
      case TierLevel.GOLD:
        return (
          <Tag
            severity="warning"
            value={rowData.tier?.name || t('tier.tier_gold', { defaultValue: 'Vàng' })}
            icon="pi pi-star-fill"
          />
        );
      case TierLevel.SILVER:
        return (
          <Tag
            severity="secondary"
            value={rowData.tier?.name || t('tier.tier_silver', { defaultValue: 'Bạc' })}
            icon="pi pi-star"
          />
        );
      default:
        return (
          <Tag
            severity="secondary"
            value={rowData.tier?.name || t('tier.tier_bronze', { defaultValue: 'Đồng' })}
          />
        );
    }
  };

  const statusBodyTemplate = (rowData: LoyaltyMemberAccount) => {
    if (rowData.status === MemberAccountStatus.ACTIVE) {
      return (
        <Tag
          severity="success"
          value={t('customer.status_active', { defaultValue: 'Đang hoạt động' })}
        />
      );
    }
    return (
      <Tag
        severity="danger"
        value={t('customer.status_inactive', { defaultValue: 'Tạm khóa' })}
      />
    );
  };

  const dateTemplate = (rowData: LoyaltyMemberAccount) => {
    return (
      <span className="font-mono text-xs text-700 white-space-nowrap">
        {rowData.createdAt ? new Date(rowData.createdAt).toLocaleDateString() : '-'}
      </span>
    );
  };

  const actionBodyTemplate = (rowData: LoyaltyMemberAccount) => {
    const isLocked =
      rowData.status === MemberAccountStatus.LOCKED ||
      rowData.status === MemberAccountStatus.INACTIVE;
    return (
      <div className="flex gap-1 justify-content-center">
        <Button
          icon="pi pi-id-card"
          rounded
          outlined
          severity="info"
          size="small"
          onClick={() => openMember360(rowData)}
          tooltip={t('customer.view_360', { defaultValue: 'Hồ sơ Member 360' })}
        />
        <Button
          icon={isLocked ? 'pi pi-unlock' : 'pi pi-lock'}
          rounded
          outlined
          severity={isLocked ? 'success' : 'danger'}
          size="small"
          onClick={() => openLockDialog(rowData)}
          tooltip={t('customer.lock_unlock_tooltip', {
            defaultValue: 'Yêu cầu khóa / mở khóa tài khoản',
          })}
        />
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-3">
        <h4 className="m-0 text-primary font-bold">
          {t('customer.management_title', {
            defaultValue: 'Quản Lý Hội Viên & Khách Hàng Loyalty',
          })}
        </h4>
        <TenantSelector
          value={selectedTenant}
          onChange={(val) => {
            setSelectedTenant(val);
            localStorage.setItem('selected_tenant_id', val);
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchData();
            }}
            placeholder={t('customer.search_placeholder', { defaultValue: 'Tìm theo SĐT...' })}
            className="p-inputtext-sm"
          />
        </span>
        <Button
          label={t('common.search', { defaultValue: 'Tìm Kiếm' })}
          icon="pi pi-search"
          onClick={fetchData}
          loading={loading}
        />
        <Button
          icon="pi pi-refresh"
          outlined
          onClick={() => {
            setSearchPhone('');
            fetchData();
          }}
        />
      </div>
    </div>
  );

  const lockActionOptions = [
    {
      label: t('customer.action_lock', { defaultValue: 'Khóa tài khoản hội viên (LOCK)' }),
      value: 'LOCK',
    },
    {
      label: t('customer.action_unlock', { defaultValue: 'Mở khóa tài khoản hội viên (UNLOCK)' }),
      value: 'UNLOCK',
    },
  ];

  return (
    <div>
      <Toast ref={toastRef} position="top-center" />
      <AppBreadcrumb items={[{ label: t('nav.customers', { defaultValue: 'Hội Viên' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          value={items}
          loading={loading}
          header={header}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage={t('common.no_data', { defaultValue: 'Không tìm thấy dữ liệu hội viên' })}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, { rowIndex }) => (
              <span className="font-mono text-xs text-600">{rowIndex + 1}</span>
            )}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />
          <Column
            header={t('common.actions', { defaultValue: 'Thao Tác' })}
            body={actionBodyTemplate}
            style={{ minWidth: '7rem', textAlign: 'center' }}
          />
          <Column
            field="externalUserId"
            header={
              <span
                title={t('customer.phone_tooltip', {
                  defaultValue: 'Số điện thoại hoặc mã hội viên',
                })}
              >
                {t('customer.phone_number', { defaultValue: 'Mã Hội Viên' })}
              </span>
            }
            body={(row: LoyaltyMemberAccount) => (
              <span
                className="font-mono font-medium text-primary white-space-nowrap cursor-pointer underline"
                onClick={() => openMember360(row)}
              >
                {row.externalUserId}
              </span>
            )}
            sortable
            style={{ minWidth: '11rem' }}
          />
          <Column
            field="fullName"
            header={t('customer.full_name', { defaultValue: 'Họ Và Tên' })}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="currentPoints"
            header={
              <span
                title={t('customer.current_points_tooltip', {
                  defaultValue: 'Số điểm khả dụng dùng để tiêu dùng hoặc đổi quà',
                })}
              >
                {t('customer.current_points', { defaultValue: 'Điểm Khả Dụng' })}
              </span>
            }
            body={(row: LoyaltyMemberAccount) => (
              <span className="font-mono text-orange-600 white-space-nowrap">
                {row.currentPoints?.toLocaleString()}{' '}
                {t('common.points', { defaultValue: 'Điểm' })}
              </span>
            )}
            sortable
            style={{ minWidth: '9.5rem', textAlign: 'center' }}
          />
          <Column
            field="tierPoints"
            header={
              <span
                title={t('customer.tier_points_tooltip', {
                  defaultValue: 'Điểm tích lũy dùng để xét phân hạng trong chu kỳ',
                })}
              >
                {t('customer.tier_points', { defaultValue: 'Điểm Xét Hạng' })}
              </span>
            }
            body={(row: LoyaltyMemberAccount) => (
              <span className="font-mono text-blue-600 white-space-nowrap">
                {row.tierPoints?.toLocaleString()} {t('common.points', { defaultValue: 'Điểm' })}
              </span>
            )}
            sortable
            style={{ minWidth: '9.5rem', textAlign: 'center' }}
          />
          <Column
            header={t('customer.tier_name', { defaultValue: 'Hạng Hội Viên' })}
            body={tierBadgeTemplate}
            style={{ minWidth: '9rem', textAlign: 'center' }}
          />
          <Column
            field="status"
            body={statusBodyTemplate}
            header={t('common.status', { defaultValue: 'Trạng Thái' })}
            sortable
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />
          <Column
            field="createdAt"
            body={dateTemplate}
            header={t('common.created_at', { defaultValue: 'Ngày Tham Gia' })}
            sortable
            style={{ minWidth: '9.5rem' }}
          />
        </DataTable>
      </div>

      {/* HV-08: Member 360 Sidebar Drawer */}
      <Sidebar
        visible={drawerVisible}
        position="right"
        style={{ width: '54rem', maxWidth: '95vw' }}
        onHide={() => setDrawerVisible(false)}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-id-card text-primary text-xl" />
            <span className="font-bold text-lg text-900">
              {t('customer.member_360_title', {
                defaultValue: 'Hồ Sơ Hội Viên 360°',
              })}
            </span>
            {selectedMember && (
              <Tag
                value={selectedMember.externalUserId}
                severity="info"
                className="font-mono text-xs ml-2"
              />
            )}
          </div>
        }
      >
        {drawerLoading ? (
          <div className="flex flex-column gap-3 p-2">
            <Skeleton height="5rem" />
            <div className="grid">
              <div className="col-4">
                <Skeleton height="4.5rem" />
              </div>
              <div className="col-4">
                <Skeleton height="4.5rem" />
              </div>
              <div className="col-4">
                <Skeleton height="4.5rem" />
              </div>
            </div>
            <Skeleton height="16rem" />
          </div>
        ) : (
          <div className="flex flex-column gap-3">
            {/* Summary Banner */}
            <div className="surface-50 border-1 surface-border border-round p-3 flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <div className="text-900 font-bold text-lg">
                  {profile360?.fullName || selectedMember?.fullName}
                </div>
                <div className="text-600 text-xs font-mono mt-1">
                  {profile360?.phoneNumber || selectedMember?.phoneNumber} •{' '}
                  {profile360?.segmentName ||
                    profile360?.segmentCode ||
                    t('customer.segment_general', { defaultValue: 'Phổ thông' })}
                </div>
              </div>
              <div className="flex align-items-center gap-2">
                {selectedMember && tierBadgeTemplate(selectedMember)}
                {selectedMember && statusBodyTemplate(selectedMember)}
                {selectedMember && (
                  <Button
                    label={t('customer.lock_unlock_btn', { defaultValue: 'Khóa / Mở khóa' })}
                    icon="pi pi-shield"
                    size="small"
                    severity="warning"
                    outlined
                    onClick={() => openLockDialog(selectedMember)}
                  />
                )}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid">
              <div className="col-12 sm:col-4">
                <div className="surface-card border-1 surface-border border-round p-3">
                  <span className="text-xs text-500 block">
                    {t('customer.current_points', { defaultValue: 'Điểm Khả Dụng' })}
                  </span>
                  <span className="text-xl font-mono font-medium text-orange-600">
                    {(profile360?.currentPoints ?? selectedMember?.currentPoints ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="col-12 sm:col-4">
                <div className="surface-card border-1 surface-border border-round p-3">
                  <span className="text-xs text-500 block">
                    {t('customer.tier_points', { defaultValue: 'Điểm Xét Hạng' })}
                  </span>
                  <span className="text-xl font-mono font-medium text-blue-600">
                    {(profile360?.tierPoints ?? selectedMember?.tierPoints ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="col-12 sm:col-4">
                <div className="surface-card border-1 surface-border border-round p-3">
                  <span className="text-xs text-500 block">
                    {t('customer.keep_tier_target', { defaultValue: 'Mục tiêu giữ hạng / Chu kỳ' })}
                  </span>
                  <span className="text-sm font-mono text-800">
                    {(profile360?.keepTierPoints ?? 0).toLocaleString()}{' '}
                    {profile360?.cycleEndAt
                      ? `(${new Date(profile360.cycleEndAt).toLocaleDateString()})`
                      : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs inside Member 360 */}
            <TabView>
              <TabPanel
                header={t('customer.fifo_buckets_tab', {
                  defaultValue: `Lô điểm sắp hết hạn FIFO (${fifoBuckets.length})`,
                })}
                leftIcon="pi pi-clock mr-2"
              >
                <DataTable
                  value={fifoBuckets}
                  size="small"
                  stripedRows
                  emptyMessage={t('customer.no_fifo_buckets', {
                    defaultValue: 'Không có lô điểm FIFO nào đang chờ hết hạn',
                  })}
                  responsiveLayout="scroll"
                >
                  <Column
                    field="bucketId"
                    header={t('customer.bucket_id', { defaultValue: 'Mã Lô' })}
                    body={(r: PointExpirationBucketModel) => (
                      <span className="font-mono text-xs white-space-nowrap">{r.bucketId}</span>
                    )}
                    style={{ minWidth: '7rem' }}
                  />
                  <Column
                    field="remainingPoints"
                    header={t('customer.remaining_points', { defaultValue: 'Điểm còn lại' })}
                    body={(r: PointExpirationBucketModel) => (
                      <span className="font-mono text-orange-600">
                        {Number(r.remainingPoints || 0).toLocaleString()} /{' '}
                        {Number(r.initialPoints || 0).toLocaleString()}
                      </span>
                    )}
                    style={{ minWidth: '8.5rem' }}
                  />
                  <Column
                    field="expiredAt"
                    header={t('customer.expired_at', { defaultValue: 'Ngày hết hạn' })}
                    body={(r: PointExpirationBucketModel) => (
                      <span className="font-mono text-xs white-space-nowrap">
                        {r.expiredAt ? new Date(r.expiredAt).toLocaleDateString() : '-'}
                      </span>
                    )}
                    style={{ minWidth: '7.5rem' }}
                  />
                  <Column
                    field="sourceRef"
                    header={t('customer.source_ref', { defaultValue: 'Nguồn gốc' })}
                    body={(r: PointExpirationBucketModel) => (
                      <span className="font-mono text-xs white-space-nowrap">{r.sourceRef || '-'}</span>
                    )}
                    style={{ minWidth: '8.5rem' }}
                  />
                  <Column
                    field="status"
                    header={t('common.status', { defaultValue: 'Trạng Thái' })}
                    body={(r: PointExpirationBucketModel) => (
                      <Tag
                        value={r.status}
                        severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'}
                        className="text-xs"
                      />
                    )}
                    style={{ minWidth: '6.5rem' }}
                  />
                </DataTable>
              </TabPanel>

              <TabPanel
                header={t('customer.recent_tx_tab', { defaultValue: 'Giao dịch gần đây' })}
                leftIcon="pi pi-history mr-2"
              >
                <DataTable
                  value={profile360?.recentTransactions || []}
                  size="small"
                  stripedRows
                  emptyMessage={t('common.no_data', { defaultValue: 'Chưa có giao dịch gần đây' })}
                  responsiveLayout="scroll"
                >
                  <Column
                    field="transactionId"
                    header={t('transaction.id', { defaultValue: 'Mã GD' })}
                    body={(r: any) => (
                      <span className="font-mono text-xs white-space-nowrap">{r.transactionId}</span>
                    )}
                    style={{ minWidth: '10rem' }}
                  />
                  <Column
                    field="actionType"
                    header={t('transaction.action_type', { defaultValue: 'Loại GD' })}
                    style={{ minWidth: '7rem' }}
                  />
                  <Column
                    field="points"
                    header={t('transaction.amount', { defaultValue: 'Điểm' })}
                    body={(r: any) => (
                      <span className="font-mono text-xs">{Number(r.points || 0).toLocaleString()}</span>
                    )}
                    style={{ minWidth: '6rem' }}
                  />
                  <Column
                    field="createdAt"
                    header={t('common.created_at', { defaultValue: 'Thời gian' })}
                    body={(r: any) => (
                      <span className="font-mono text-xs white-space-nowrap">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
                      </span>
                    )}
                    style={{ minWidth: '9.5rem' }}
                  />
                </DataTable>
              </TabPanel>

              <TabPanel
                header={t('customer.recent_vouchers_tab', { defaultValue: 'Voucher sở hữu' })}
                leftIcon="pi pi-ticket mr-2"
              >
                <DataTable
                  value={profile360?.recentVouchers || []}
                  size="small"
                  stripedRows
                  emptyMessage={t('common.no_data', { defaultValue: 'Chưa có voucher nào' })}
                  responsiveLayout="scroll"
                >
                  <Column
                    field="voucherCode"
                    header={t('voucher.code', { defaultValue: 'Mã Voucher' })}
                    body={(r: any) => (
                      <span className="font-mono text-xs white-space-nowrap">{r.voucherCode}</span>
                    )}
                    style={{ minWidth: '9rem' }}
                  />
                  <Column
                    field="title"
                    header={t('voucher.title_label', { defaultValue: 'Tiêu Đề' })}
                    style={{ minWidth: '12rem' }}
                  />
                  <Column
                    field="status"
                    header={t('common.status', { defaultValue: 'Trạng Thái' })}
                    style={{ minWidth: '7rem' }}
                  />
                </DataTable>
              </TabPanel>
            </TabView>
          </div>
        )}
      </Sidebar>

      {/* HV-09: Lock or unlock a member Dialog (2-layer Approval Queue) */}
      <Dialog
        visible={lockDialogVisible}
        style={{ width: '34rem' }}
        breakpoints={{ '960px': '75vw', '641px': '95vw' }}
        header={t('customer.lock_unlock_dialog_title', {
          defaultValue: 'Yêu cầu Khóa / Mở khóa Tài khoản Hội viên (Duyệt 2 lớp)',
        })}
        modal
        className="p-fluid"
        onHide={() => setLockDialogVisible(false)}
      >
        {selectedMember && (
          <div className="flex flex-column gap-3">
            <div className="surface-50 p-3 border-round border-1 surface-border flex justify-content-between align-items-center">
              <div>
                <div className="font-medium text-900">{selectedMember.fullName}</div>
                <div className="font-mono text-xs text-primary">{selectedMember.externalUserId}</div>
              </div>
              {statusBodyTemplate(selectedMember)}
            </div>

            <div className="field mb-0">
              <label className="font-medium text-sm">
                {t('customer.lock_action_label', { defaultValue: 'Hành động đề xuất' })}
              </label>
              <Dropdown
                value={lockAction}
                options={lockActionOptions}
                onChange={(e) => setLockAction(e.value)}
                appendTo="self"
              />
            </div>

            <div className="field mb-0">
              <label className="font-medium text-sm">
                {t('customer.lock_ticket_ref', { defaultValue: 'Mã hồ sơ / Ticket hỗ trợ' })}
              </label>
              <InputText
                value={lockTicketRef}
                onChange={(e) => setLockTicketRef(e.target.value)}
                placeholder="VD: CSKH-2026-0812"
                className="font-mono"
              />
            </div>

            <div className="field mb-0">
              <label className="font-medium text-sm">
                {t('customer.lock_reason_label', { defaultValue: 'Lý do thực hiện' })}{' '}
                <span className="text-red-500">*</span>
              </label>
              <InputTextarea
                rows={3}
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder={t('customer.lock_reason_placeholder', {
                  defaultValue: 'Mô tả chi tiết lý do nghi ngờ gian lận hoặc yêu cầu mở khóa...',
                })}
              />
            </div>

            <div className="p-2 border-round bg-orange-50 text-orange-800 text-xs">
              <i className="pi pi-info-circle mr-2" />
              {t('customer.lock_maker_checker_note', {
                defaultValue:
                  'Yêu cầu sẽ được chuyển sang Hàng đợi Phê duyệt Hai cấp (QT-04) để Checker thẩm định trước khi có hiệu lực.',
              })}
            </div>

            <div className="flex justify-content-end gap-2 mt-2">
              <Button
                label={t('common.cancel', { defaultValue: 'Hủy' })}
                icon="pi pi-times"
                outlined
                onClick={() => setLockDialogVisible(false)}
                disabled={lockSubmitting}
              />
              <Button
                label={t('customer.submit_approval', { defaultValue: 'Gửi duyệt 2 lớp' })}
                icon="pi pi-send"
                severity={lockAction === 'LOCK' ? 'danger' : 'success'}
                onClick={handleSubmitLockRequest}
                loading={lockSubmitting}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Customers;
