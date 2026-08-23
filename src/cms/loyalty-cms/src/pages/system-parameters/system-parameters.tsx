import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { useTranslation } from 'react-i18next';
import { SystemParameter, systemParameterService } from '@/service/system-parameter.service';
import { AppBreadcrumb } from 'components';

export const SystemParameters: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useState<SystemParameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<SystemParameter>>({});
  const [isEdit, setIsEdit] = useState(false);

  const fetchParams = async () => {
    setLoading(true);
    try {
      const data = await systemParameterService.getAllParameters();
      setParams(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[SystemParameters.fetchParams] Error:', e);
      setParams([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchParams();
  }, []);

  const openNew = () => {
    setFormData({ status: 1 });
    setIsEdit(false);
    setShowDialog(true);
  };

  const editParam = (param: SystemParameter) => {
    setFormData({ ...param });
    setIsEdit(true);
    setShowDialog(true);
  };

  const saveParam = async () => {
    try {
      if (isEdit && formData.paramKey) {
        await systemParameterService.updateParameter(formData.paramKey, formData as SystemParameter);
      } else {
        await systemParameterService.createParameter(formData as SystemParameter);
      }
      setShowDialog(false);
      fetchParams();
    } catch (e) {
      console.error('[SystemParameters.saveParam] Error:', e);
    }
  };

  const actionBodyTemplate = (rowData: SystemParameter) => {
    return (
      <div className="flex gap-2">
        <Button icon="pi pi-pencil" rounded outlined severity="warning" size="small" onClick={() => editParam(rowData)} tooltip={t('common.edit', { defaultValue: 'Sửa' })} />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: SystemParameter) => {
    return rowData.status === 1 ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Hoạt động' })} />
    ) : (
      <Tag severity="secondary" value={t('common.inactive', { defaultValue: 'Tắt' })} />
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0 text-primary">{t('system_parameter.management_title', { defaultValue: 'Cấu hình Tham số Hệ thống Smart OTP' })}</h4>
      <div className="flex gap-2">
        <Button label={t('system_parameter.add_new', { defaultValue: 'Thêm Tham số' })} icon="pi pi-plus" severity="success" onClick={openNew} />
        <Button icon="pi pi-refresh" rounded outlined onClick={fetchParams} tooltip={t('common.refresh', { defaultValue: 'Làm mới' })} />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.system_parameters', { defaultValue: 'Tham số hệ thống' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable
          value={params}
          loading={loading}
          header={header}
          dataKey="paramKey"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu tham số' })}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column field="paramKey" header={t('system_parameter.key', { defaultValue: 'Mã Tham số (Key)' })} sortable style={{ width: '18rem' }} />
          <Column field="paramValue" header={t('system_parameter.value', { defaultValue: 'Giá trị' })} sortable style={{ width: '12rem' }} />
          <Column field="description" header={t('system_parameter.description', { defaultValue: 'Mô tả ý nghĩa' })} sortable />
          <Column body={statusBodyTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ width: '8rem' }} />
          <Column field="updatedAt" header={t('common.updated_at', { defaultValue: 'Cập nhật lần cuối' })} sortable />
          <Column body={actionBodyTemplate} exportable={false} header={t('common.actions', { defaultValue: 'Thao tác' })} style={{ minWidth: '6rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '36rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={isEdit ? t('system_parameter.edit_title', { defaultValue: 'Cập nhật Tham số' }) : t('system_parameter.create_title', { defaultValue: 'Thêm Tham số Hệ thống' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="paramKey" className="font-bold">{t('system_parameter.key', { defaultValue: 'Mã Tham số (Key)' })}</label>
          <InputText
            id="paramKey"
            value={formData.paramKey || ''}
            onChange={(e) => setFormData({ ...formData, paramKey: e.target.value })}
            required
            autoFocus
            disabled={isEdit}
            placeholder="VD: OTP_TIME_STEP_SECONDS"
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="paramValue" className="font-bold">{t('system_parameter.value', { defaultValue: 'Giá trị' })}</label>
          <InputText
            id="paramValue"
            value={formData.paramValue || ''}
            onChange={(e) => setFormData({ ...formData, paramValue: e.target.value })}
            required
            placeholder="VD: 30"
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="description" className="font-bold">{t('system_parameter.description', { defaultValue: 'Mô tả' })}</label>
          <InputText
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="VD: Chu kỳ thay đổi mã OTP theo giây (mặc định 30s)"
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu thay đổi' })} icon="pi pi-check" onClick={saveParam} />
        </div>
      </Dialog>
    </div>
  );
};

export default SystemParameters;
