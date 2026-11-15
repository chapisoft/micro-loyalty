import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { StatusBadge } from '@/components/StatusBadge';
import { categoryService, GeneralCategory } from '@/service/category.service';
import { GeneralCategoryFormModal } from './GeneralCategoryFormModal';

export const GeneralCategoryManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const toastRef = useRef<Toast>(null);

  const notify = (severity: 'success' | 'warn' | 'error', summary: string, detail: string) => {
    toastRef.current?.show({ severity, summary, detail, life: 3000 });
  };

  // State cho nhóm danh mục (Bên trái)
  const [groups, setGroups] = useState<GeneralCategory[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GeneralCategory | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [isGroupLoading, setIsGroupLoading] = useState(false);

  // State cho danh mục giá trị (Bên phải)
  const [items, setItems] = useState<GeneralCategory[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [isItemLoading, setIsItemLoading] = useState(false);

  // State modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCategoryType, setModalCategoryType] = useState('CATEGORY_GROUP');
  const [modalCategoryTypeName, setModalCategoryTypeName] = useState('');
  const [editingItem, setEditingItem] = useState<GeneralCategory | null>(null);

  // Tải danh sách nhóm danh mục
  const loadGroups = useCallback(async (autoSelectFirst = false) => {
    setIsGroupLoading(true);
    try {
      const list = await categoryService.getCategoryGroups();
      setGroups(list);
      if (autoSelectFirst && list.length > 0) {
        setSelectedGroup(list[0]);
      } else if (selectedGroup) {
        const updated = list.find((g) => g.code === selectedGroup.code);
        if (updated) setSelectedGroup(updated);
      }
    } catch {
      notify('error', 'Lỗi', t('category.load_groups_error', 'Không thể tải danh sách nhóm danh mục'));
    } finally {
      setIsGroupLoading(false);
    }
  }, [selectedGroup, t]);

  // Tải danh sách giá trị thuộc nhóm đang chọn
  const loadItems = useCallback(async (groupCode: string) => {
    if (!groupCode) {
      setItems([]);
      return;
    }
    setIsItemLoading(true);
    try {
      const list = await categoryService.getCategoriesByType(groupCode, true);
      setItems(list);
    } catch {
      notify('error', 'Lỗi', t('category.load_items_error', 'Không thể tải danh mục giá trị'));
    } finally {
      setIsItemLoading(false);
    }
  }, [t]);

  // Khởi tạo
  useEffect(() => {
    loadGroups(true);
  }, [loadGroups]);

  // Khi chọn nhóm thì nạp các giá trị con
  useEffect(() => {
    if (selectedGroup?.code) {
      loadItems(selectedGroup.code);
    } else {
      setItems([]);
    }
  }, [selectedGroup, loadItems]);

  // Lọc nhóm theo từ khóa
  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter(
      (g) => g.code.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)
    );
  }, [groups, groupSearch]);

  // Lọc giá trị theo từ khóa
  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();
    return items.filter(
      (i) =>
        i.code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q))
    );
  }, [items, itemSearch]);

  // Thao tác với Nhóm
  const handleAddGroup = () => {
    setModalCategoryType('CATEGORY_GROUP');
    setModalCategoryTypeName(t('category.group_category', 'Nhóm danh mục loại'));
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEditGroup = (e: React.MouseEvent, group: GeneralCategory) => {
    e.stopPropagation();
    setModalCategoryType('CATEGORY_GROUP');
    setModalCategoryTypeName(t('category.group_category', 'Nhóm danh mục loại'));
    setEditingItem(group);
    setModalVisible(true);
  };

  const handleDeleteGroup = (e: React.MouseEvent, group: GeneralCategory) => {
    e.stopPropagation();
    confirmDialog({
      message: (
        <div>
          <p className="m-0 font-medium text-red-600">
            {t(
              'category.confirm_delete_group',
              'Bạn có chắc chắn muốn xóa nhóm danh mục "{name}" ({code}) không?',
              { name: group.name, code: group.code }
            )}
          </p>
          <small className="text-500 block mt-2">
            {t(
              'category.delete_group_warning',
              'Cảnh báo: Toàn bộ các giá trị thuộc nhóm này sẽ bị xóa cùng nhóm!'
            )}
          </small>
        </div>
      ),
      header: t('category.delete_group_header', 'Xác nhận xóa nhóm danh mục'),
      icon: 'pi pi-exclamation-triangle text-red-500',
      acceptLabel: t('common.delete', 'Xóa bỏ'),
      rejectLabel: t('common.cancel', 'Hủy'),
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await categoryService.deleteCategory('CATEGORY_GROUP', group.code);
          notify('success', 'Thành công', t('category.delete_group_success', 'Đã xóa nhóm danh mục thành công'));
          if (selectedGroup?.code === group.code) {
            setSelectedGroup(null);
            setItems([]);
          }
          await loadGroups(false);
        } catch (err: any) {
          notify('error', 'Lỗi', err?.message || 'Không thể xóa nhóm danh mục');
        }
      },
    });
  };

  // Thao tác với Giá trị
  const handleAddItem = () => {
    if (!selectedGroup) return;
    setModalCategoryType(selectedGroup.code);
    setModalCategoryTypeName(selectedGroup.name);
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEditItem = (item: GeneralCategory) => {
    if (!selectedGroup) return;
    setModalCategoryType(selectedGroup.code);
    setModalCategoryTypeName(selectedGroup.name);
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDeleteItem = (item: GeneralCategory) => {
    if (!selectedGroup) return;
    confirmDialog({
      message: t(
        'category.confirm_delete_item',
        'Bạn có chắc chắn muốn xóa giá trị danh mục "{name}" ({code})?',
        { name: item.name, code: item.code }
      ),
      header: t('category.delete_item_header', 'Xác nhận xóa giá trị danh mục'),
      icon: 'pi pi-exclamation-triangle text-orange-500',
      acceptLabel: t('common.delete', 'Xóa'),
      rejectLabel: t('common.cancel', 'Hủy'),
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await categoryService.deleteCategory(selectedGroup.code, item.code);
          notify('success', 'Thành công', t('category.delete_item_success', 'Đã xóa giá trị danh mục thành công'));
          loadItems(selectedGroup.code);
        } catch (err: any) {
          notify('error', 'Lỗi', err?.message || 'Không thể xóa giá trị danh mục');
        }
      },
    });
  };

  // Làm mới bộ nhớ đệm
  const handleRefreshCache = async () => {
    try {
      await categoryService.evictBackendCache();
      notify('success', 'Thành công', t('category.cache_refreshed', 'Đã xóa bộ nhớ đệm danh mục thành công'));
      await loadGroups(false);
      if (selectedGroup?.code) {
        loadItems(selectedGroup.code);
      }
    } catch {
      notify('error', 'Lỗi', 'Lỗi khi làm mới bộ nhớ đệm');
    }
  };

  // Xuất Excel danh mục
  const handleExportExcel = () => {
    if (!selectedGroup || items.length === 0) {
      notify('warn', 'Cảnh báo', t('category.no_data_export', 'Không có dữ liệu để xuất'));
      return;
    }
    const headers = ['STT', 'Mã giá trị', 'Tên hiển thị', 'Mã cha', 'Thứ tự', 'Trạng thái', 'Mô tả'];
    const rows = filteredItems.map((item, idx) => [
      idx + 1,
      item.code,
      `"${item.name.replace(/"/g, '""')}"`,
      item.parentCode || '',
      item.displayOrder ?? 0,
      item.status === 1 ? 'Hoạt động' : 'Vô hiệu hóa',
      `"${(item.description || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DanhMuc_${selectedGroup.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card p-3">
      <Toast ref={toastRef} position="top-right" />
      <ConfirmDialog />

      {/* Tiêu đề trang & Thanh tác vụ toàn cục */}
      <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-3 pb-3 border-bottom-1 surface-border gap-2">
        <div>
          <h2 className="text-xl font-bold m-0 text-900">
            {t('category.page_title', 'Quản lý Danh mục Dữ liệu')}
          </h2>
          <span className="text-sm text-500">
            {t(
              'category.page_subtitle',
              'Quản lý danh mục loại và danh mục giá trị động dùng chung cho toàn bộ hệ sinh thái Loyalty'
            )}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            label={t('category.refresh_cache', 'Làm mới Cache')}
            icon="pi pi-sync"
            className="p-button-outlined p-button-secondary p-button-sm"
            onClick={handleRefreshCache}
            tooltip={t('category.refresh_cache_tooltip', 'Xóa cache nạp lại dữ liệu mới nhất')}
            type="button"
          />
        </div>
      </div>

      {/* Bố cục Bảng Đôi (Double Table) chuẩn DIP */}
      <div className="grid">
        {/* Cột Trái (35%): Danh mục Nhóm / Loại */}
        <div className="col-12 lg:col-4 xl:col-4">
          <div className="surface-card border-1 surface-border border-round overflow-hidden shadow-1 flex flex-column h-full">
            {/* Header Cột Trái */}
            <div className="p-3 surface-ground border-bottom-1 surface-border flex justify-content-between align-items-center">
              <div>
                <span className="font-bold text-base text-900 block">
                  {t('category.group_list', 'Nhóm danh mục loại')}
                </span>
                <small className="text-500">
                  {t('category.total_groups', 'Tổng: {count} nhóm', { count: filteredGroups.length })}
                </small>
              </div>
              <Button
                label={t('common.add_new', 'Thêm mới')}
                tooltip={t('category.add_group_tooltip', 'Thêm nhóm danh mục mới')}
                icon="pi pi-plus"
                size="small"
                className="p-button-primary p-button-sm"
                onClick={handleAddGroup}
                type="button"
              />
            </div>

            {/* Ô tìm kiếm nhanh nhóm */}
            <div className="p-2 border-bottom-1 surface-border">
              <span className="p-input-icon-left w-full">
                <i className="pi pi-search" />
                <InputText
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder={t('category.search_group_placeholder', 'Tìm mã hoặc tên nhóm...')}
                  className="w-full p-inputtext-sm"
                />
              </span>
            </div>

            {/* Bảng Danh sách Nhóm */}
            <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              <DataTable
                value={filteredGroups}
                loading={isGroupLoading}
                selectionMode="single"
                selection={selectedGroup}
                onSelectionChange={(e) => setSelectedGroup(e.value as GeneralCategory)}
                dataKey="code"
                responsiveLayout="scroll"
                emptyMessage={t('category.no_groups_found', 'Không tìm thấy nhóm danh mục nào')}
                rowClassName={(data) => ({
                  'surface-100 font-semibold text-primary border-left-3 border-primary':
                    selectedGroup?.code === data.code,
                  'cursor-pointer': true,
                })}
                size="small"
              >
                <Column
                  header="#"
                  body={(_, options) => (
                    <span className="text-500 text-xs">{options.rowIndex + 1}</span>
                  )}
                  style={{ width: '45px', textAlign: 'center' }}
                />
                <Column
                  field="code"
                  header={t('category.code', 'Mã nhóm')}
                  body={(row: GeneralCategory) => (
                    <span className="font-bold font-mono text-xs text-primary">{row.code}</span>
                  )}
                  style={{ width: '130px' }}
                />
                <Column
                  field="name"
                  header={t('category.name', 'Tên nhóm')}
                  body={(row: GeneralCategory) => (
                    <div>
                      <span className="font-semibold text-sm block">{row.name}</span>
                      {row.description && (
                        <small className="text-500 text-xs block text-overflow-ellipsis overflow-hidden white-space-nowrap" style={{ maxWidth: '160px' }}>
                          {row.description}
                        </small>
                      )}
                    </div>
                  )}
                />
                <Column
                  header={t('common.actions', 'Thao tác')}
                  body={(row: GeneralCategory) => (
                    <div className="flex gap-1 justify-content-end">
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-text p-button-sm p-button-secondary p-0"
                        style={{ width: '28px', height: '28px' }}
                        onClick={(e) => handleEditGroup(e, row)}
                        tooltip={t('common.edit', 'Sửa nhóm')}
                        type="button"
                      />
                      <Button
                        icon="pi pi-trash"
                        className="p-button-text p-button-sm p-button-danger p-0"
                        style={{ width: '28px', height: '28px' }}
                        onClick={(e) => handleDeleteGroup(e, row)}
                        tooltip={t('common.delete', 'Xóa nhóm')}
                        type="button"
                      />
                    </div>
                  )}
                  style={{ width: '70px', textAlign: 'right' }}
                />
              </DataTable>
            </div>
          </div>
        </div>

        {/* Cột Phải (65%): Danh mục Giá trị của Nhóm đang chọn */}
        <div className="col-12 lg:col-8 xl:col-8">
          <div className="surface-card border-1 surface-border border-round shadow-1 p-3 h-full flex flex-column">
            {selectedGroup ? (
              <>
                {/* Header Cột Phải */}
                <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-3 gap-2 pb-2 border-bottom-1 surface-border">
                  <div>
                    <div className="flex align-items-center gap-2">
                      <span className="font-bold text-lg text-900">{selectedGroup.name}</span>
                      <span className="font-mono text-xs px-2 py-1 surface-200 border-round font-bold text-primary">
                        {selectedGroup.code}
                      </span>
                    </div>
                    {selectedGroup.description && (
                      <span className="text-xs text-500 block mt-1">{selectedGroup.description}</span>
                    )}
                  </div>

                  <div className="flex align-items-center gap-2 w-full md:w-auto justify-content-end">
                    <span className="p-input-icon-left" style={{ width: '220px' }}>
                      <i className="pi pi-search" />
                      <InputText
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder={t('category.search_items_placeholder', 'Tìm mã, tên giá trị...')}
                        className="w-full p-inputtext-sm"
                      />
                    </span>
                    <Button
                      label={t('common.export_excel', 'Xuất Excel')}
                      icon="pi pi-file-excel"
                      className="p-button-outlined p-button-success p-button-sm"
                      onClick={handleExportExcel}
                      disabled={filteredItems.length === 0}
                      type="button"
                    />
                    <Button
                      label={t('common.add_new', 'Thêm mới')}
                      tooltip={t('category.add_item_tooltip', 'Thêm mới giá trị danh mục')}
                      icon="pi pi-plus"
                      className="p-button-primary p-button-sm"
                      onClick={handleAddItem}
                      type="button"
                    />
                  </div>
                </div>

                {/* Bảng Giá Trị Danh Mục */}
                <div className="flex-1 overflow-auto">
                  <DataTable
                    value={filteredItems}
                    loading={isItemLoading}
                    dataKey="code"
                    responsiveLayout="scroll"
                    scrollable
                    scrollHeight="calc(100vh - 300px)"
                    emptyMessage={t('category.no_items_found', 'Chưa có giá trị nào trong nhóm này')}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[10, 20, 50]}
                    currentPageReportTemplate="{first} - {last} / {totalRecords}"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
                    size="small"
                    className="p-datatable-gridlines"
                  >
                    <Column
                      header="#"
                      body={(_, options) => (
                        <span className="text-500 text-xs font-semibold">{options.rowIndex + 1}</span>
                      )}
                      style={{ width: '50px', textAlign: 'center' }}
                      frozen
                    />
                    <Column
                      header={t('common.actions', 'Thao tác')}
                      body={(row: GeneralCategory) => (
                        <div className="flex gap-1 align-items-center">
                          <Button
                            icon="pi pi-pencil"
                            className="p-button-text p-button-sm p-button-secondary p-0"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => handleEditItem(row)}
                            tooltip={t('common.edit', 'Chỉnh sửa')}
                            type="button"
                          />
                          <Button
                            icon="pi pi-trash"
                            className="p-button-text p-button-sm p-button-danger p-0"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => handleDeleteItem(row)}
                            tooltip={t('common.delete', 'Xóa')}
                            type="button"
                          />
                        </div>
                      )}
                      style={{ width: '80px', textAlign: 'center' }}
                      frozen
                    />
                    <Column
                      field="code"
                      header={t('category.code', 'Mã giá trị')}
                      body={(row: GeneralCategory) => (
                        <span className="font-bold font-mono text-sm text-900">{row.code}</span>
                      )}
                      style={{ minWidth: '140px' }}
                      sortable
                    />
                    <Column
                      field="name"
                      header={t('category.name', 'Tên hiển thị')}
                      body={(row: GeneralCategory) => (
                        <span className="font-semibold text-sm">{row.name}</span>
                      )}
                      style={{ minWidth: '200px' }}
                      sortable
                    />
                    <Column
                      field="parentCode"
                      header={t('category.parent_code', 'Mã cha')}
                      body={(row: GeneralCategory) => (
                        row.parentCode ? (
                          <span className="font-mono text-xs px-2 py-1 surface-200 border-round">
                            {row.parentCode}
                          </span>
                        ) : (
                          <span className="text-400">-</span>
                        )
                      )}
                      style={{ minWidth: '110px' }}
                    />
                    <Column
                      field="displayOrder"
                      header={t('category.display_order', 'Thứ tự')}
                      body={(row: GeneralCategory) => (
                        <span className="text-center block">{row.displayOrder ?? 0}</span>
                      )}
                      style={{ width: '80px', textAlign: 'center' }}
                      sortable
                    />
                    <Column
                      field="status"
                      header={t('category.status', 'Trạng thái')}
                      body={(row: GeneralCategory) => (
                        <StatusBadge status={row.status === 1 ? 'ACTIVE' : 'INACTIVE'} />
                      )}
                      style={{ width: '130px', textAlign: 'center' }}
                      sortable
                    />
                    <Column
                      field="description"
                      header={t('category.description', 'Mô tả')}
                      body={(row: GeneralCategory) => (
                        <span className="text-sm text-600">{row.description || '-'}</span>
                      )}
                      style={{ minWidth: '220px' }}
                    />
                  </DataTable>
                </div>
              </>
            ) : (
              <div className="flex flex-column align-items-center justify-content-center p-8 text-center text-500 my-auto">
                <i className="pi pi-folder-open text-6xl text-300 mb-3" />
                <h3 className="m-0 text-lg font-semibold text-700">
                  {t('category.select_group_prompt', 'Chọn một nhóm danh mục ở cột bên trái')}
                </h3>
                <p className="text-sm mt-1 max-w-20rem">
                  {t(
                    'category.select_group_desc',
                    'Vui lòng nhấp vào một nhóm danh mục để xem, tìm kiếm và quản lý các giá trị danh mục tương ứng.'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Thêm / Sửa Danh mục */}
      <GeneralCategoryFormModal
        visible={modalVisible}
        onHide={() => setModalVisible(false)}
        onSuccess={() => {
          if (modalCategoryType === 'CATEGORY_GROUP') {
            loadGroups(false);
          } else if (selectedGroup?.code) {
            loadItems(selectedGroup.code);
          }
        }}
        categoryType={modalCategoryType}
        categoryTypeName={modalCategoryTypeName}
        initialData={editingItem}
        parentOptions={modalCategoryType !== 'CATEGORY_GROUP' ? items.filter((i) => i.code !== editingItem?.code) : []}
        onNotify={notify}
      />
    </div>
  );
};

export default GeneralCategoryManagementPage;
