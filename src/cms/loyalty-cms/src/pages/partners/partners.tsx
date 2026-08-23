import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from 'react-i18next';
import { Partner, partnerService } from '@/service/partner.service';
import { AppBreadcrumb } from 'components';

export const Partners: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Partner>>({});
  const [isEdit, setIsEdit] = useState(false);

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

  const editItem = (item: Partner) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  const saveItem = async () => {
    try {
      if (isEdit && formData.id) {
        await partnerService.update(formData.id, formData as Partner);
      } else {
        await partnerService.create(formData as Partner);
      }
      setShowDialog(false);
      fetchData();
    } catch (e) {
      console.error('[Partners.saveItem] Error:', e);
    }
  };

  const actionBodyTemplate = (rowData: Partner) => {
    return (
      <div className="flex gap-2">
        <Button icon="pi pi-pencil" rounded outlined severity="warning" size="small" onClick={() => editItem(rowData)} tooltip={t('common.edit', { defaultValue: 'Sửa' })} />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Partner) => {
    return rowData.status === 1 ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Hoạt động' })} />
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
    { label: t('common.active', { defaultValue: 'Hoạt động (Active)' }), value: 1 },
    { label: t('common.inactive', { defaultValue: 'Ngừng hoạt động (Inactive)' }), value: 0 },
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0 text-primary font-bold">{t('partner.management_title', { defaultValue: 'Quản lý Đối tác Tích hợp (Partners)' })}</h4>
      <div className="flex gap-2">
        <Button label={t('partner.add_new', { defaultValue: 'Thêm Đối tác' })} icon="pi pi-plus" severity="success" onClick={openNew} />
        <Button icon="pi pi-refresh" rounded outlined onClick={fetchData} tooltip={t('common.refresh', { defaultValue: 'Làm mới' })} />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.partners', { defaultValue: 'Đối tác' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable
          value={items}
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
          <Column field="id" header="ID" sortable style={{ width: '5rem' }} />
          <Column field="partnerCode" header={t('partner.code', { defaultValue: 'Mã Đối tác' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="partnerName" header={t('partner.name', { defaultValue: 'Tên Đối tác' })} sortable style={{ minWidth: '14rem' }} />
          <Column field="status" body={statusBodyTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem' }} />
          <Column field="createdAt" body={dateTemplate} header={t('common.created_at', { defaultValue: 'Ngày tạo' })} sortable style={{ minWidth: '12rem' }} />
          <Column body={actionBodyTemplate} exportable={false} header={t('common.actions', { defaultValue: 'Thao tác' })} style={{ minWidth: '8rem' }} />
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
          <label htmlFor="partnerCode" className="font-bold">{t('partner.code', { defaultValue: 'Mã Đối tác (VD: NATCASH)' })}</label>
          <InputText
            id="partnerCode"
            value={formData.partnerCode || ''}
            onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
            required
            autoFocus
            disabled={isEdit}
            placeholder="VD: NATCASH"
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="partnerName" className="font-bold">{t('partner.name', { defaultValue: 'Tên Đối tác' })}</label>
          <InputText
            id="partnerName"
            value={formData.partnerName || ''}
            onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
            required
            placeholder="VD: Natcash Payment Service"
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
