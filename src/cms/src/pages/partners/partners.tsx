import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useTranslation } from 'react-i18next';
import { Partner, partnerService } from '@/service/partner.service';
import { AppBreadcrumb } from 'components';

export const Partners: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<Partner[]>([]);
  const [selectedItems, setSelectedItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Partner>>({});
  const [isEdit, setIsEdit] = useState(false);
  const toast = useRef<Toast>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await partnerService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[Partners.fetchData] Error:', e);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNew = () => {
    setFormData({ status: 1 });
    setIsEdit(false);
    setShowDialog(true);
  };

  const deleteItem = async (item: Partner) => {
    if (!item.id) return;
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa đối tác "${item.partnerName}" khỏi hệ thống không?`,
      header: t('common.confirm_delete', { defaultValue: 'Xác nhận Xóa Đối Tác' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.delete', { defaultValue: 'Xóa' }),
      rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
      accept: async () => {
        try {
          await partnerService.delete(item.id!);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success', { defaultValue: 'Thành công' }),
            detail: 'Đã xóa đối tác thành công!',
            life: 3000,
          });
          fetchData();
        } catch (e: any) {
          console.error('[Partners.deleteItem] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error', { defaultValue: 'Lỗi' }),
            detail: 'Xóa đối tác thất bại: ' + (e?.message || 'Lỗi hệ thống'),
            life: 4000,
          });
        }
      },
    });
  };

  const editItem = (item: Partner) => {
    const statusVal = item.status === 'ACTIVE' || item.status === 1 ? 1 : 0;
    setFormData({ ...item, status: statusVal });
    setIsEdit(true);
    setShowDialog(true);
  };

  const executeSave = async () => {
    try {
      if (isEdit && formData.id) {
        await partnerService.update(formData.id, formData as Partner);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: 'Cập nhật thông tin đối tác thành công!',
          life: 3000,
        });
      } else {
        await partnerService.create(formData as Partner);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: 'Thêm mới đối tác thành công!',
          life: 3000,
        });
      }
      setShowDialog(false);
      fetchData();
    } catch (e: any) {
      console.error('[Partners.saveItem] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: 'Lưu đối tác thất bại: ' + (e?.message || 'Lỗi hệ thống'),
        life: 4000,
      });
    }
  };

  const saveItem = () => {
    if (isEdit) {
      confirmDialog({
        message: `Bạn có chắc chắn muốn lưu các thay đổi cho đối tác "${formData.partnerName || ''}"?`,
        header: t('common.confirm_update', { defaultValue: 'Xác nhận Cập Nhật' }),
        icon: 'pi pi-question-circle',
        acceptLabel: t('common.confirm', { defaultValue: 'Xác nhận' }),
        rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
        accept: executeSave,
      });
    } else {
      executeSave();
    }
  };

  const actionBodyTemplate = (rowData: Partner) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          severity="warning"
          size="small"
          onClick={() => editItem(rowData)}
          tooltip={t('common.edit', { defaultValue: 'Chỉnh sửa' })}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          size="small"
          onClick={() => deleteItem(rowData)}
          tooltip={t('common.delete', { defaultValue: 'Xóa đối tác' })}
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Partner) => {
    const isActive = rowData.status === 1 || rowData.status === 'ACTIVE';
    return isActive ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Đang hoạt động' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Ngừng hoạt động' })} />
    );
  };

  const dateTemplate = (rowData: Partner) => {
    if (!rowData.createdAt) return '-';
    try {
      const d = new Date(rowData.createdAt);
      if (isNaN(d.getTime())) return rowData.createdAt;
      return d.toLocaleString('vi-VN');
    } catch {
      return rowData.createdAt;
    }
  };

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang hoạt động' }), value: 1 },
    { label: t('common.inactive', { defaultValue: 'Ngừng hoạt động' }), value: 0 },
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0 text-primary font-bold">{t('partner.management_title', { defaultValue: 'Quản lý Đối tác Liên minh' })}</h4>
      <div className="flex gap-2">
        <Button label={t('partner.add_new', { defaultValue: 'Thêm Đối tác' })} icon="pi pi-plus" severity="success" onClick={openNew} />
        <Button icon="pi pi-refresh" rounded outlined onClick={fetchData} tooltip={t('common.refresh', { defaultValue: 'Làm mới' })} />
      </div>
    </div>
  );

  return (
    <div>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('nav.partners', { defaultValue: 'Đối tác' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable
          value={items}
          selection={selectedItems}
          onSelectionChange={(e) => setSelectedItems(e.value as Partner[])}
          loading={loading}
          header={header}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu đối tác' })}
          stripedRows
          responsiveLayout="scroll"
        >
          {/* Cột 1: Checkbox */}
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          {/* Cột 2: STT */}
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />

          {/* Cột 3: Thao tác / Hành động */}
          <Column
            body={actionBodyTemplate}
            exportable={false}
            header={t('common.actions', { defaultValue: 'Thao tác' })}
            style={{ width: '8rem' }}
          />

          {/* Cột 4 trở đi: Dữ liệu nghiệp vụ */}
          <Column field="partnerCode" header={t('partner.code', { defaultValue: 'Mã Đối tác' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="partnerName" header={t('partner.name', { defaultValue: 'Tên Đối tác' })} sortable style={{ minWidth: '14rem' }} />
          <Column field="status" body={statusBodyTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem' }} />
          <Column field="createdAt" body={dateTemplate} header={t('common.created_at', { defaultValue: 'Ngày tạo' })} sortable style={{ minWidth: '12rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={isEdit ? t('partner.edit_title', { defaultValue: 'Cập nhật Đối tác' }) : t('partner.create_title', { defaultValue: 'Thêm mới Đối tác' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="partnerCode" className="font-bold">{t('partner.code', { defaultValue: 'Mã Đối tác' })}</label>
          <InputText
            id="partnerCode"
            value={formData.partnerCode || ''}
            onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
            required
            autoFocus
            disabled={isEdit}
            placeholder={t('partner.code_placeholder', { defaultValue: 'Nhập mã đối tác (ví dụ: DELIMART)' })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="partnerName" className="font-bold">{t('partner.name', { defaultValue: 'Tên Đối tác' })}</label>
          <InputText
            id="partnerName"
            value={formData.partnerName || ''}
            onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
            required
            placeholder={t('partner.name_placeholder', { defaultValue: 'Nhập tên đối tác liên minh' })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="status" className="font-bold">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
          <Dropdown
            id="status"
            value={formData.status ?? 1}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
            placeholder={t('common.select_status', { defaultValue: 'Chọn trạng thái' })}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu thông tin' })} icon="pi pi-check" onClick={saveItem} />
        </div>
      </Dialog>
    </div>
  );
};

export default Partners;
