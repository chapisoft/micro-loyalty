import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { categoryService, GeneralCategory } from '@/service/category.service';

interface GeneralCategoryFormModalProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: () => void;
  categoryType: string;
  categoryTypeName?: string;
  initialData?: GeneralCategory | null;
  parentOptions?: GeneralCategory[];
  onNotify?: (severity: 'success' | 'warn' | 'error', summary: string, detail: string) => void;
}

export const GeneralCategoryFormModal: React.FC<GeneralCategoryFormModalProps> = ({
  visible,
  onHide,
  onSuccess,
  categoryType,
  categoryTypeName,
  initialData,
  parentOptions = [],
  onNotify,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const isGroup = categoryType === 'CATEGORY_GROUP';

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentCode, setParentCode] = useState<string | null>(null);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setCode(initialData.code || '');
        setName(initialData.name || '');
        setParentCode(initialData.parentCode || null);
        setDisplayOrder(initialData.displayOrder ?? 0);
        setDescription(initialData.description || '');
        setIsActive(initialData.status !== 0);
      } else {
        setCode('');
        setName('');
        setParentCode(null);
        setDisplayOrder(0);
        setDescription('');
        setIsActive(true);
      }
    }
  }, [visible, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode) {
      onNotify?.('warn', 'Cảnh báo', t('category.validation.code_required', 'Vui lòng nhập mã danh mục'));
      return;
    }
    if (!cleanName) {
      onNotify?.('warn', 'Cảnh báo', t('category.validation.name_required', 'Vui lòng nhập tên danh mục'));
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<GeneralCategory> = {
        categoryType,
        code: cleanCode,
        name: cleanName,
        parentCode: parentCode || null,
        displayOrder: displayOrder || 0,
        description: description.trim() || undefined,
        status: isActive ? 1 : 0,
      };

      if (isEdit) {
        await categoryService.updateCategory(categoryType, cleanCode, payload);
        onNotify?.('success', 'Thành công', t('category.update_success', 'Cập nhật danh mục thành công'));
      } else {
        await categoryService.createCategory(payload);
        onNotify?.('success', 'Thành công', t('category.create_success', 'Thêm mới danh mục thành công'));
      }
      onSuccess();
      onHide();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu danh mục';
      onNotify?.('error', 'Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const dialogTitle = isEdit
    ? isGroup
      ? t('category.edit_group_title', 'Chỉnh sửa nhóm danh mục')
      : t('category.edit_item_title', 'Chỉnh sửa giá trị danh mục')
    : isGroup
      ? t('category.add_group_title', 'Thêm mới nhóm danh mục')
      : t('category.add_item_title', 'Thêm mới giá trị danh mục');

  const footerContent = (
    <div className="flex justify-content-end gap-2 pt-2">
      <Button
        label={t('common.cancel', 'Hủy')}
        icon="pi pi-times"
        className="p-button-text p-button-secondary"
        onClick={onHide}
        disabled={submitting}
        type="button"
      />
      <Button
        label={t('common.save', 'Lưu')}
        icon="pi pi-check"
        className="p-button-primary"
        onClick={handleSubmit}
        loading={submitting}
        type="submit"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div>
          <span className="font-bold text-lg">{dialogTitle}</span>
          {!isGroup && categoryTypeName && (
            <div className="text-xs text-500 font-normal mt-1">
              {t('category.belong_to_group', 'Thuộc nhóm')}:{' '}
              <strong className="text-primary">{categoryTypeName}</strong> ({categoryType})
            </div>
          )}
        </div>
      }
      modal
      style={{ width: '480px', maxWidth: '95vw' }}
      footer={footerContent}
    >
      <form onSubmit={handleSubmit} className="p-fluid flex flex-column gap-3 pt-2">
        <div>
          <label htmlFor="categoryCode" className="font-semibold block mb-1">
            {t('category.code', 'Mã danh mục')} <span className="text-red-500">*</span>
          </label>
          <InputText
            id="categoryCode"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={isGroup ? 'VD: PARTNER_TYPE' : 'VD: RETAIL'}
            disabled={isEdit}
            className="font-bold font-mono"
            autoFocus={!isEdit}
          />
          {isEdit && (
            <small className="text-500 block mt-1">
              {t('category.code_immutable', 'Mã danh mục không thể thay đổi sau khi tạo')}
            </small>
          )}
        </div>

        <div>
          <label htmlFor="categoryName" className="font-semibold block mb-1">
            {t('category.name', 'Tên hiển thị')} <span className="text-red-500">*</span>
          </label>
          <InputText
            id="categoryName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isGroup ? 'VD: Loại đối tác liên minh' : 'VD: Bán lẻ & Cửa hàng tiện lợi'}
          />
        </div>

        {!isGroup && parentOptions.length > 0 && (
          <div>
            <label htmlFor="parentCode" className="font-semibold block mb-1">
              {t('category.parent_code', 'Danh mục cha (nếu có)')}
            </label>
            <Dropdown
              id="parentCode"
              value={parentCode}
              options={parentOptions.map((opt) => ({
                label: `${opt.name} (${opt.code})`,
                value: opt.code,
              }))}
              onChange={(e) => setParentCode(e.value)}
              placeholder={t('category.select_parent', '-- Không có danh mục cha --')}
              showClear
            />
          </div>
        )}

        <div>
          <label htmlFor="displayOrder" className="font-semibold block mb-1">
            {t('category.display_order', 'Thứ tự hiển thị')}
          </label>
          <InputNumber
            id="displayOrder"
            value={displayOrder}
            onValueChange={(e) => setDisplayOrder(e.value ?? 0)}
            min={0}
            max={9999}
            showButtons
          />
        </div>

        <div>
          <label htmlFor="description" className="font-semibold block mb-1">
            {t('category.description', 'Mô tả giải thích')}
          </label>
          <InputTextarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            autoResize
            placeholder={t('category.description_placeholder', 'Mô tả chi tiết ý nghĩa nghiệp vụ...')}
          />
        </div>

        <div className="flex align-items-center justify-content-between p-2 surface-ground border-round">
          <div>
            <span className="font-semibold block">{t('category.status', 'Trạng thái hoạt động')}</span>
            <small className="text-500">
              {isActive
                ? t('category.active_hint', 'Cho phép sử dụng trong các chức năng và bộ lọc')
                : t('category.inactive_hint', 'Vô hiệu hóa tạm thời')}
            </small>
          </div>
          <InputSwitch checked={isActive} onChange={(e) => setIsActive(e.value ?? false)} />
        </div>
      </form>
    </Dialog>
  );
};
