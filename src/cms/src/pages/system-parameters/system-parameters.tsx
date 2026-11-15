import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useTranslation } from 'react-i18next';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';
import {
  ParamValueType,
  SysCodeTypeConfig,
  SystemParameter,
  systemParameterService
} from '@/service/system-parameter.service';

const PARAM_GROUP_CODES = [
  'ALL',
  'WALLET',
  'POLICY',
  'QR',
  'SECURITY',
  'WEBHOOK',
  'ENGAGEMENT',
  'BUDGET',
  'PARTNER',
  'SETTLEMENT',
  'TIER',
  'CAMPAIGN',
  'GAMEHUB',
  'AGENT',
  'APPROVAL',
  'SYSTEM'
] as const;

const PARAM_VALUE_TYPES: readonly ParamValueType[] = [
  'STRING',
  'BOOLEAN',
  'INTEGER',
  'DECIMAL',
  'ENUM',
  'TIME_WINDOW',
  'JSON'
] as const;

const CODE_PLACEHOLDERS = [
  '{prefix}',
  '{period}',
  '{tenant}',
  '{scope}',
  '{kind}',
  '{date}',
  '{seq:6}'
] as const;

const SAMPLE_PREVIEW_PARAMS: Record<string, string> = {
  period: '202611',
  scope: 'PARTNER01',
  kind: 'REWARD'
};

const TIME_WINDOW_REGEX = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

const isKnownGroup = (code?: string): boolean =>
  Boolean(code && (PARAM_GROUP_CODES as readonly string[]).includes(code));

export const SystemParameters: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [activeTab, setActiveTab] = useState(0);

  // Tab 1: System Parameters
  const [params, setParams] = useState<SystemParameter[]>([]);
  const [loadingParams, setLoadingParams] = useState(false);
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [paramSearch, setParamSearch] = useState<string>('');
  const [showParamDialog, setShowParamDialog] = useState(false);
  const [paramForm, setParamForm] = useState<Partial<SystemParameter>>({});
  const [isEditParam, setIsEditParam] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Tab 2: Code Types
  const [codeTypes, setCodeTypes] = useState<SysCodeTypeConfig[]>([]);
  const [loadingCodeTypes, setLoadingCodeTypes] = useState(false);
  const [codeTypeSearch, setCodeTypeSearch] = useState<string>('');
  const [showCodeTypeDialog, setShowCodeTypeDialog] = useState(false);
  const [codeTypeForm, setCodeTypeForm] = useState<Partial<SysCodeTypeConfig>>({});
  const [livePreview, setLivePreview] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  const groupOptions = useMemo(
    () =>
      PARAM_GROUP_CODES.map((code) => ({
        label: t(`system_parameter.groups.${code}`),
        value: code
      })),
    [t]
  );

  const editableGroupOptions = useMemo(
    () => groupOptions.filter((opt) => opt.value !== 'ALL'),
    [groupOptions]
  );

  const typeOptions = useMemo(
    () => PARAM_VALUE_TYPES.map((typeCode) => ({ label: typeCode, value: typeCode })),
    []
  );

  const fetchParams = useCallback(async () => {
    setLoadingParams(true);
    try {
      const data = await systemParameterService.getAllParameters(selectedGroup, paramSearch);
      setParams(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[SystemParameters.fetchParams] Error:', e);
      setParams([]);
    } finally {
      setLoadingParams(false);
    }
  }, [selectedGroup, paramSearch]);

  const fetchCodeTypes = useCallback(async () => {
    setLoadingCodeTypes(true);
    try {
      const data = await systemParameterService.getCodeTypes();
      setCodeTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[SystemParameters.fetchCodeTypes] Error:', e);
      setCodeTypes([]);
    } finally {
      setLoadingCodeTypes(false);
    }
  }, []);

  useEffect(() => {
    fetchParams();
  }, [fetchParams]);

  useEffect(() => {
    if (activeTab === 1 && codeTypes.length === 0) {
      fetchCodeTypes();
    }
  }, [activeTab, codeTypes.length, fetchCodeTypes]);

  const filteredCodeTypes = useMemo(() => {
    const q = codeTypeSearch.trim().toLowerCase();
    if (!q) return codeTypes;
    return codeTypes.filter(
      (item) =>
        (item.codeType || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.formatTemplate || '').toLowerCase().includes(q) ||
        (item.staticPrefix || '').toLowerCase().includes(q)
    );
  }, [codeTypes, codeTypeSearch]);

  const handleRefreshCache = async () => {
    setRefreshingCache(true);
    try {
      const result = await systemParameterService.refreshCache();
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('system_parameter.refresh_cache_success', {
          params: result?.parametersCached ?? 0,
          codes: result?.codeTypesCached ?? 0
        }),
        life: 3500
      });
      await Promise.all([fetchParams(), fetchCodeTypes()]);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: `${t('system_parameter.refresh_cache_failed')}: ${e?.message || ''}`,
        life: 4000
      });
    } finally {
      setRefreshingCache(false);
    }
  };

  // ==================== TAB 1 ACTIONS ====================

  const openNewParam = () => {
    setParamForm({
      paramKey: '',
      paramName: '',
      paramValue: '',
      valueType: 'STRING',
      groupCode: selectedGroup !== 'ALL' ? selectedGroup : 'SYSTEM',
      allowedValues: '',
      description: '',
      status: 1
    });
    setJsonError(null);
    setIsEditParam(false);
    setShowParamDialog(true);
  };

  const openEditParam = (param: SystemParameter) => {
    setParamForm({
      ...param,
      valueType: (param.valueType || 'STRING').toUpperCase(),
      groupCode: (param.groupCode || 'SYSTEM').toUpperCase()
    });
    setJsonError(null);
    setIsEditParam(true);
    setShowParamDialog(true);
  };

  const handleValueTypeChange = (nextType: ParamValueType) => {
    setJsonError(null);
    let nextValue = paramForm.paramValue ?? '';
    if (nextType === 'BOOLEAN' && nextValue !== 'true' && nextValue !== 'false') {
      nextValue = 'false';
    }
    setParamForm((prev) => ({
      ...prev,
      valueType: nextType,
      paramValue: nextValue
    }));
  };

  const formatJsonValue = () => {
    try {
      const parsed = JSON.parse(paramForm.paramValue || '{}');
      const pretty = JSON.stringify(parsed, null, 2);
      setParamForm((prev) => ({ ...prev, paramValue: pretty }));
      setJsonError(null);
    } catch {
      setJsonError(t('system_parameter.json_invalid'));
    }
  };

  const deleteParam = (param: SystemParameter) => {
    if (!param.paramKey) return;
    confirmDialog({
      message: t('system_parameter.confirm_delete_msg', {
        key: param.paramKey,
        name: param.paramName || param.description || ''
      }),
      header: t('common.confirm_delete'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.delete'),
      rejectLabel: t('common.cancel'),
      accept: async () => {
        try {
          await systemParameterService.deleteParameter(param.paramKey);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('system_parameter.delete_success'),
            life: 3000
          });
          fetchParams();
        } catch (e: any) {
          toast.current?.show({
            severity: 'error',
            summary: t('common.error'),
            detail: `${t('system_parameter.delete_failed')}: ${e?.message || ''}`,
            life: 4000
          });
        }
      }
    });
  };

  const executeSaveParam = async () => {
    try {
      const payload: Partial<SystemParameter> = {
        paramKey: paramForm.paramKey?.trim().toUpperCase(),
        paramName: paramForm.paramName,
        paramValue: paramForm.paramValue ?? '',
        valueType: (paramForm.valueType || 'STRING').toUpperCase(),
        groupCode: (paramForm.groupCode || 'SYSTEM').toUpperCase(),
        allowedValues: paramForm.allowedValues,
        description: paramForm.description,
        status: paramForm.status ?? 1
      };

      if (isEditParam && payload.paramKey) {
        await systemParameterService.updateParameter(payload.paramKey, payload);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success'),
          detail: t('system_parameter.update_success'),
          life: 3000
        });
      } else {
        await systemParameterService.createParameter(payload);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success'),
          detail: t('system_parameter.create_success'),
          life: 3000
        });
      }
      setShowParamDialog(false);
      fetchParams();
    } catch (e: any) {
      const detailMsg = e?.response?.data?.message || e?.message || '';
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: `${t('system_parameter.save_failed')}: ${detailMsg}`,
        life: 4000
      });
    }
  };

  const validateParamForm = (): boolean => {
    const key = (paramForm.paramKey || '').trim();
    const rawVal = paramForm.paramValue;
    const type = (paramForm.valueType || 'STRING').toUpperCase();

    if (!key || rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('system_parameter.validation_required'),
        life: 3500
      });
      return false;
    }
    if (type === 'TIME_WINDOW' && !TIME_WINDOW_REGEX.test(String(rawVal).trim())) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('system_parameter.time_window_invalid'),
        life: 3500
      });
      return false;
    }
    if (type === 'JSON') {
      try {
        JSON.parse(String(rawVal));
        setJsonError(null);
      } catch {
        setJsonError(t('system_parameter.json_invalid'));
        return false;
      }
    }
    return true;
  };

  const saveParam = () => {
    if (!validateParamForm()) return;
    if (isEditParam) {
      confirmDialog({
        message: t('system_parameter.confirm_update_msg', { key: paramForm.paramKey }),
        header: t('common.confirm_update'),
        icon: 'pi pi-question-circle',
        acceptLabel: t('common.confirm'),
        rejectLabel: t('common.cancel'),
        accept: executeSaveParam
      });
    } else {
      executeSaveParam();
    }
  };

  // ==================== TAB 2 ACTIONS ====================

  const runCodePreview = useCallback(async (config: Partial<SysCodeTypeConfig>) => {
    if (!config.codeType || !config.formatTemplate || !config.formatTemplate.includes('{seq')) {
      setLivePreview('');
      return;
    }
    setLoadingPreview(true);
    try {
      const res = await systemParameterService.previewCodeType(
        config.codeType,
        config,
        SAMPLE_PREVIEW_PARAMS
      );
      setLivePreview(res?.preview || '');
    } catch {
      setLivePreview('');
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  const openEditCodeType = (item: SysCodeTypeConfig) => {
    const initial = { ...item };
    setCodeTypeForm(initial);
    setLivePreview(item.samplePreview || '');
    setShowCodeTypeDialog(true);
    runCodePreview(initial);
  };

  const {
    codeType: previewCodeTypeKey,
    formatTemplate: previewFormatTemplate,
    staticPrefix: previewStaticPrefix,
    dateFormat: previewDateFormat,
    seqPadding: previewSeqPadding
  } = codeTypeForm;

  useEffect(() => {
    if (!showCodeTypeDialog || !previewCodeTypeKey) return;
    const timer = setTimeout(() => {
      runCodePreview({
        codeType: previewCodeTypeKey,
        formatTemplate: previewFormatTemplate,
        staticPrefix: previewStaticPrefix,
        dateFormat: previewDateFormat,
        seqPadding: previewSeqPadding
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [
    showCodeTypeDialog,
    previewCodeTypeKey,
    previewFormatTemplate,
    previewStaticPrefix,
    previewDateFormat,
    previewSeqPadding,
    runCodePreview
  ]);

  const appendPlaceholder = (token: string) => {
    setCodeTypeForm((prev) => ({
      ...prev,
      formatTemplate: `${prev.formatTemplate || ''}${token}`
    }));
  };

  const executeSaveCodeType = async () => {
    if (!codeTypeForm.codeType) return;
    try {
      await systemParameterService.updateCodeType(codeTypeForm.codeType, codeTypeForm);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('system_parameter.code_types.update_success'),
        life: 3000
      });
      setShowCodeTypeDialog(false);
      fetchCodeTypes();
    } catch (e: any) {
      const detailMsg = e?.response?.data?.message || e?.message || '';
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: `${t('system_parameter.code_types.save_failed')}: ${detailMsg}`,
        life: 4000
      });
    }
  };

  const saveCodeType = () => {
    if (!codeTypeForm.formatTemplate || !codeTypeForm.formatTemplate.includes('{seq')) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('system_parameter.code_types.template_missing_seq'),
        life: 3500
      });
      return;
    }
    confirmDialog({
      message: t('system_parameter.code_types.confirm_update_msg', {
        code: codeTypeForm.codeType
      }),
      header: t('common.confirm_update'),
      icon: 'pi pi-question-circle',
      acceptLabel: t('common.confirm'),
      rejectLabel: t('common.cancel'),
      accept: executeSaveCodeType
    });
  };

  // ==================== SMART PARAM INPUT RENDERER ====================

  const renderSmartParamValueInput = () => {
    const type = ((paramForm.valueType || 'STRING') as string).toUpperCase();

    if (type === 'BOOLEAN') {
      const checked = String(paramForm.paramValue).toLowerCase() === 'true';
      return (
        <div className="flex align-items-center gap-3 p-2 border-1 surface-border border-round">
          <InputSwitch
            id="paramValueSwitch"
            checked={checked}
            onChange={(e) =>
              setParamForm((prev) => ({ ...prev, paramValue: e.value ? 'true' : 'false' }))
            }
          />
          <Tag
            severity={checked ? 'success' : 'secondary'}
            value={checked ? t('system_parameter.boolean_enabled') : t('system_parameter.boolean_disabled')}
          />
        </div>
      );
    }

    if (type === 'ENUM') {
      const options = (paramForm.allowedValues || '')
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({ label: item, value: item }));

      if (options.length > 0) {
        return (
          <Dropdown
            id="paramValueEnum"
            value={paramForm.paramValue || null}
            options={options}
            onChange={(e) => setParamForm((prev) => ({ ...prev, paramValue: e.value }))}
            placeholder={t('system_parameter.select_option')}
          />
        );
      }
    }

    if (type === 'INTEGER' || type === 'DECIMAL') {
      const numericVal =
        paramForm.paramValue !== undefined && paramForm.paramValue !== ''
          ? Number(paramForm.paramValue)
          : null;
      return (
        <InputNumber
          id="paramValueNumber"
          value={numericVal !== null && !Number.isNaN(numericVal) ? numericVal : null}
          onValueChange={(e) =>
            setParamForm((prev) => ({
              ...prev,
              paramValue: e.value !== null && e.value !== undefined ? String(e.value) : ''
            }))
          }
          useGrouping={false}
          minFractionDigits={0}
          maxFractionDigits={type === 'INTEGER' ? 0 : 4}
          placeholder={t('system_parameter.value_placeholder')}
        />
      );
    }

    if (type === 'JSON') {
      return (
        <div>
          <InputTextarea
            id="paramValueJson"
            value={paramForm.paramValue || ''}
            onChange={(e) => {
              setJsonError(null);
              setParamForm((prev) => ({ ...prev, paramValue: e.target.value }));
            }}
            rows={5}
            className="font-mono text-sm"
            placeholder={t('system_parameter.value_placeholder')}
          />
          <div className="flex justify-content-between align-items-center mt-2">
            <Button
              type="button"
              size="small"
              outlined
              icon="pi pi-code"
              label={t('system_parameter.json_format_btn')}
              className="w-auto"
              onClick={formatJsonValue}
            />
            {jsonError ? (
              <small className="text-red-500">{jsonError}</small>
            ) : (
              paramForm.paramValue && <small className="text-green-600">{t('system_parameter.json_valid')}</small>
            )}
          </div>
        </div>
      );
    }

    if (type === 'TIME_WINDOW') {
      const raw = (paramForm.paramValue || '').trim();
      const invalid = raw.length > 0 && !TIME_WINDOW_REGEX.test(raw);
      return (
        <div>
          <InputText
            id="paramValueWindow"
            value={paramForm.paramValue || ''}
            onChange={(e) => setParamForm((prev) => ({ ...prev, paramValue: e.target.value }))}
            className={`font-mono ${invalid ? 'p-invalid' : ''}`}
            placeholder={t('system_parameter.time_window_hint')}
          />
          <small className={invalid ? 'text-red-500 block mt-1' : 'text-500 block mt-1'}>
            {invalid ? t('system_parameter.time_window_invalid') : t('system_parameter.time_window_hint')}
          </small>
        </div>
      );
    }

    return (
      <InputText
        id="paramValue"
        value={paramForm.paramValue || ''}
        onChange={(e) => setParamForm((prev) => ({ ...prev, paramValue: e.target.value }))}
        placeholder={t('system_parameter.value_placeholder')}
      />
    );
  };

  // ==================== TEMPLATES ====================

  const renderHeaderTitle = (labelKey: string, tooltipKey: string) => (
    <span title={t(tooltipKey)} className="cursor-help">
      {t(labelKey)}
    </span>
  );

  const paramActionBody = (rowData: SystemParameter) => (
    <StandardRowActions
      onEdit={() => openEditParam(rowData)}
      onDelete={!rowData.fromDefault ? () => deleteParam(rowData) : undefined}
    />
  );

  const handleExportParams = () => {
    exportToExcel(
      params.map((p, idx) => ({
        stt: idx + 1,
        paramKey: p.paramKey,
        paramName: p.paramName || '',
        groupCode: p.groupCode || '',
        valueType: p.valueType || '',
        paramValue: p.paramValue || '',
        source: p.fromDefault ? t('system_parameter.source_default') : t('system_parameter.source_db'),
        description: p.description || '',
        status: p.status === 1 ? t('common.active') : t('common.inactive'),
      })),
      [
        { key: 'stt', header: t('common.stt') },
        { key: 'paramKey', header: t('system_parameter.key') },
        { key: 'paramName', header: t('system_parameter.name') },
        { key: 'groupCode', header: t('system_parameter.group') },
        { key: 'valueType', header: t('system_parameter.type') },
        { key: 'paramValue', header: t('system_parameter.value') },
        { key: 'source', header: t('system_parameter.source_db') },
        { key: 'description', header: t('system_parameter.description') },
        { key: 'status', header: t('common.status') },
      ],
      'Danh_Sach_Tham_So_He_Thong'
    );
  };

  const handleExportCodeTypes = () => {
    exportToExcel(
      filteredCodeTypes.map((c, idx) => ({
        stt: idx + 1,
        codeType: c.codeType,
        description: c.description || '',
        formatTemplate: c.formatTemplate || '',
        samplePreview: c.samplePreview || '',
        status: c.status === 1 ? t('common.active') : t('common.inactive'),
      })),
      [
        { key: 'stt', header: t('common.stt') },
        { key: 'codeType', header: t('system_parameter.code_types.code_type') },
        { key: 'description', header: t('system_parameter.description') },
        { key: 'formatTemplate', header: t('system_parameter.code_types.format_template') },
        { key: 'samplePreview', header: t('system_parameter.code_types.sample_preview') },
        { key: 'status', header: t('common.status') },
      ],
      'Danh_Sach_Quy_Tac_Sinh_Ma'
    );
  };

  const paramKeyBody = (rowData: SystemParameter) => (
    <div>
      <span className="font-bold font-mono text-900 text-sm">{rowData.paramKey}</span>
      {rowData.paramName && (
        <div className="text-xs text-600 font-normal mt-1">{rowData.paramName}</div>
      )}
    </div>
  );

  const paramValueBody = (rowData: SystemParameter) => {
    const val = rowData.paramValue || '';
    const type = (rowData.valueType || 'STRING').toUpperCase();
    if (type === 'BOOLEAN') {
      const on = val.toLowerCase() === 'true';
      return (
        <Tag
          severity={on ? 'success' : 'secondary'}
          value={on ? t('system_parameter.boolean_enabled') : t('system_parameter.boolean_disabled')}
        />
      );
    }
    return (
      <span className="font-mono text-sm font-normal text-900" title={val}>
        {val.length > 42 ? `${val.slice(0, 42)}...` : val}
      </span>
    );
  };

  const paramSourceBody = (rowData: SystemParameter) => (
    <span className="text-900">
      {rowData.fromDefault ? t('system_parameter.source_default') : t('system_parameter.source_db')}
    </span>
  );

  const statusBody = (rowData: { status?: number }) =>
    rowData.status === 1 ? (
      <Tag severity="success" value={t('common.active')} />
    ) : (
      <Tag severity="secondary" value={t('common.inactive')} />
    );

  const paramsToolbarHeader = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div>
        <h4 className="m-0 text-primary font-semibold">{t('system_parameter.management_title')}</h4>
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        <Dropdown
          value={selectedGroup}
          options={groupOptions}
          onChange={(e) => setSelectedGroup(e.value)}
          placeholder={t('system_parameter.filter_group')}
          style={{ minWidth: '13rem' }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={paramSearch}
            onChange={(e) => setParamSearch(e.target.value)}
            placeholder={t('system_parameter.search_placeholder')}
            style={{ width: '16rem' }}
          />
        </span>
        <Button
          label={t('system_parameter.refresh_cache')}
          icon="pi pi-sync"
          outlined
          severity="info"
          loading={refreshingCache}
          onClick={handleRefreshCache}
          tooltip={t('system_parameter.refresh_cache_tooltip')}
        />
        <Button
          label={t('system_parameter.add_new')}
          icon="pi pi-plus"
          severity="success"
          onClick={openNewParam}
        />
      </div>
    </div>
  );

  const codeTypesToolbarHeader = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <h4 className="m-0 text-primary font-semibold">
        {t('system_parameter.code_types.management_title')}
      </h4>
      <div className="flex flex-wrap gap-2 align-items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={codeTypeSearch}
            onChange={(e) => setCodeTypeSearch(e.target.value)}
            placeholder={t('system_parameter.code_types.search_placeholder')}
            style={{ width: '16rem' }}
          />
        </span>
        <Button
          label={t('system_parameter.refresh_cache')}
          icon="pi pi-sync"
          outlined
          severity="info"
          loading={refreshingCache}
          onClick={handleRefreshCache}
          tooltip={t('system_parameter.refresh_cache_tooltip')}
        />
        <Button
          icon="pi pi-refresh"
          rounded
          outlined
          onClick={fetchCodeTypes}
          tooltip={t('common.refresh')}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      <StandardPageHeader
        title={t('nav.system_parameters')}
        subtitle={t('system_parameter.subtitle', 'Cấu hình tham số động hệ thống, danh mục tiền tệ và quy tắc sinh mã')}
        breadcrumbs={[{ label: t('nav.system_parameters') }]}
        primaryAction={activeTab === 0 ? {
          label: t('system_parameter.add_new'),
          icon: 'pi pi-plus',
          onClick: openNewParam,
        } : undefined}
        extraActions={[
          {
            label: t('system_parameter.refresh_cache'),
            icon: 'pi pi-sync',
            severity: 'info',
            outlined: true,
            loading: refreshingCache,
            onClick: handleRefreshCache,
          },
        ]}
      />

      <div className="card shadow-1 border-round surface-card p-3 w-full">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          <TabPanel header={t('system_parameter.tab_parameters')} leftIcon="pi pi-sliders-h mr-2">
            <UniversalFilterBar
              searchValue={paramSearch}
              onSearchChange={setParamSearch}
              searchPlaceholder={t('system_parameter.search_placeholder')}
              basicFilters={[
                {
                  key: 'groupCode',
                  label: t('system_parameter.filter_group'),
                  value: selectedGroup,
                  options: groupOptions,
                  onChange: (val) => setSelectedGroup(val),
                  placeholder: t('system_parameter.filter_group'),
                },
              ]}
              onExport={handleExportParams}
              onReset={() => {
                setParamSearch('');
                setSelectedGroup('ALL');
              }}
              onRefresh={fetchParams}
            />

            <DataTable
              value={params}
              loading={loadingParams}
              dataKey="paramKey"
              paginator
              rows={15}
              rowsPerPageOptions={[15, 30, 50]}
              emptyMessage={t('common.no_data')}
              stripedRows
              responsiveLayout="scroll"
              size="small"
            >
              <Column
                header={t('common.stt')}
                body={(_: any, options: any) => (
                  <span className="font-mono text-xs text-600 font-normal">
                    {options.rowIndex + 1}
                  </span>
                )}
                style={{ width: '3.5rem', textAlign: 'center' }}
              />
              <Column
                body={paramActionBody}
                exportable={false}
                header={t('common.actions')}
                style={{ width: '6rem', textAlign: 'center' }}
              />
              <Column
                field="paramKey"
                header={renderHeaderTitle('system_parameter.key', 'system_parameter.key_tooltip')}
                body={paramKeyBody}
                sortable
                style={{ minWidth: '17rem' }}
              />
              <Column
                field="groupCode"
                header={renderHeaderTitle('system_parameter.group', 'system_parameter.group_tooltip')}
                body={(row: SystemParameter) => (
                  <span className="text-900">
                    {isKnownGroup(row.groupCode)
                      ? t(`system_parameter.groups.${row.groupCode}`)
                      : row.groupCode || t('system_parameter.groups.SYSTEM')}
                  </span>
                )}
                sortable
                style={{ width: '10rem' }}
              />
              <Column
                field="valueType"
                header={renderHeaderTitle('system_parameter.type', 'system_parameter.type_tooltip')}
                body={(row: SystemParameter) => (
                  <span className="font-mono text-xs text-900 font-normal">
                    {row.valueType || 'STRING'}
                  </span>
                )}
                sortable
                style={{ width: '8rem' }}
              />
              <Column
                field="paramValue"
                header={renderHeaderTitle('system_parameter.value', 'system_parameter.value_tooltip')}
                body={paramValueBody}
                sortable
                style={{ minWidth: '12rem' }}
              />
              <Column
                header={renderHeaderTitle('system_parameter.source_db', 'system_parameter.source_tooltip')}
                body={paramSourceBody}
                style={{ width: '8rem' }}
              />
              <Column
                field="description"
                header={renderHeaderTitle(
                  'system_parameter.description',
                  'system_parameter.description_tooltip'
                )}
                body={(row: SystemParameter) => (
                  <span className="text-sm font-normal text-900">{row.description || '-'}</span>
                )}
              />
              <Column body={statusBody} header={t('common.status')} style={{ width: '7.5rem', textAlign: 'center' }} />
            </DataTable>
          </TabPanel>

          <TabPanel header={t('system_parameter.tab_code_types')} leftIcon="pi pi-hashtag mr-2">
            <UniversalFilterBar
              searchValue={codeTypeSearch}
              onSearchChange={setCodeTypeSearch}
              searchPlaceholder={t('system_parameter.code_types.search_placeholder')}
              onExport={handleExportCodeTypes}
              onReset={() => setCodeTypeSearch('')}
              onRefresh={fetchCodeTypes}
            />

            <DataTable
              value={filteredCodeTypes}
              loading={loadingCodeTypes}
              dataKey="codeType"
              paginator
              rows={15}
              rowsPerPageOptions={[15, 30, 50]}
              emptyMessage={t('common.no_data')}
              stripedRows
              responsiveLayout="scroll"
              size="small"
            >
              <Column
                header={t('common.stt')}
                body={(_: any, options: any) => (
                  <span className="font-mono text-xs text-600 font-normal">
                    {options.rowIndex + 1}
                  </span>
                )}
                style={{ width: '3.5rem', textAlign: 'center' }}
              />
              <Column
                header={t('common.actions')}
                style={{ width: '5.5rem', textAlign: 'center' }}
                body={(row: SysCodeTypeConfig) => (
                  <StandardRowActions
                    onEdit={() => openEditCodeType(row)}
                  />
                )}
              />
              <Column
                field="codeType"
                header={renderHeaderTitle(
                  'system_parameter.code_types.code_type',
                  'system_parameter.code_types.code_type_tooltip'
                )}
                sortable
                style={{ minWidth: '13rem' }}
                body={(row: SysCodeTypeConfig) => (
                  <div>
                    <span className="font-bold font-mono text-900 text-sm">
                      {row.codeType}
                    </span>
                    {row.description && (
                      <div className="text-xs text-600 font-normal mt-1">{row.description}</div>
                    )}
                  </div>
                )}
              />
              <Column
                field="formatTemplate"
                header={renderHeaderTitle(
                  'system_parameter.code_types.template',
                  'system_parameter.code_types.template_tooltip'
                )}
                body={(row: SysCodeTypeConfig) => (
                  <span className="font-mono text-sm font-normal text-900">{row.formatTemplate}</span>
                )}
                sortable
              />
              <Column
                field="staticPrefix"
                header={renderHeaderTitle(
                  'system_parameter.code_types.prefix',
                  'system_parameter.code_types.prefix_tooltip'
                )}
                body={(row: SysCodeTypeConfig) => (
                  <span className="font-mono text-sm font-normal text-900">{row.staticPrefix}</span>
                )}
                style={{ width: '8rem' }}
              />
              <Column
                field="dateFormat"
                header={renderHeaderTitle(
                  'system_parameter.code_types.date_format',
                  'system_parameter.code_types.date_format_tooltip'
                )}
                body={(row: SysCodeTypeConfig) => (
                  <span className="font-mono text-sm font-normal">{row.dateFormat}</span>
                )}
                style={{ width: '8rem' }}
              />
              <Column
                field="seqPadding"
                header={renderHeaderTitle(
                  'system_parameter.code_types.padding',
                  'system_parameter.code_types.padding_tooltip'
                )}
                body={(row: SysCodeTypeConfig) => (
                  <span className="font-mono text-sm font-normal">{row.seqPadding}</span>
                )}
                style={{ width: '7rem', textAlign: 'center' }}
              />
              <Column
                field="seqName"
                header={renderHeaderTitle(
                  'system_parameter.code_types.seq_name',
                  'system_parameter.code_types.seq_name_tooltip'
                )}
                body={(row: SysCodeTypeConfig) => (
                  <span className="font-mono text-xs text-700 font-normal">{row.seqName}</span>
                )}
                style={{ minWidth: '10rem' }}
              />
              <Column
                field="samplePreview"
                header={renderHeaderTitle(
                  'system_parameter.code_types.preview',
                  'system_parameter.code_types.preview_tooltip'
                )}
                body={(row: SysCodeTypeConfig) => (
                  <Tag
                    severity="success"
                    className="font-mono font-normal"
                    value={row.samplePreview || '-'}
                  />
                )}
                style={{ minWidth: '12rem' }}
              />
              <Column body={statusBody} header={t('common.status')} style={{ width: '7rem' }} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      {/* Modal Tab 1: Edit/Create System Parameter */}
      <Dialog
        visible={showParamDialog}
        style={{ width: '40rem' }}
        breakpoints={{ '960px': '75vw', '641px': '94vw' }}
        header={isEditParam ? t('system_parameter.edit_title') : t('system_parameter.create_title')}
        modal
        className="p-fluid"
        onHide={() => setShowParamDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="paramKey" className="font-medium block mb-1">
            {t('system_parameter.key')}
          </label>
          <InputText
            id="paramKey"
            value={paramForm.paramKey || ''}
            onChange={(e) =>
              setParamForm((prev) => ({ ...prev, paramKey: e.target.value.toUpperCase() }))
            }
            disabled={isEditParam}
            className="font-mono"
            placeholder={t('system_parameter.key_placeholder')}
          />
        </div>

        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="paramGroup" className="font-medium block mb-1">
              {t('system_parameter.group')}
            </label>
            <Dropdown
              id="paramGroup"
              value={paramForm.groupCode || 'SYSTEM'}
              options={editableGroupOptions}
              onChange={(e) => setParamForm((prev) => ({ ...prev, groupCode: e.value }))}
            />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="paramType" className="font-medium block mb-1">
              {t('system_parameter.type')}
            </label>
            <Dropdown
              id="paramType"
              value={(paramForm.valueType || 'STRING') as ParamValueType}
              options={typeOptions}
              disabled={isEditParam}
              onChange={(e) => handleValueTypeChange(e.value)}
            />
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="paramName" className="font-medium block mb-1">
            {t('system_parameter.name')}
          </label>
          <InputText
            id="paramName"
            value={paramForm.paramName || ''}
            onChange={(e) => setParamForm((prev) => ({ ...prev, paramName: e.target.value }))}
            placeholder={t('system_parameter.name_placeholder')}
          />
        </div>

        {((paramForm.valueType || 'STRING') as string).toUpperCase() === 'ENUM' && !isEditParam && (
          <div className="field mb-3">
            <label htmlFor="allowedValues" className="font-medium block mb-1">
              {t('system_parameter.allowed_values')}
            </label>
            <InputText
              id="allowedValues"
              value={paramForm.allowedValues || ''}
              onChange={(e) =>
                setParamForm((prev) => ({ ...prev, allowedValues: e.target.value }))
              }
              className="font-mono"
              placeholder={t('system_parameter.allowed_values_placeholder')}
            />
          </div>
        )}

        <div className="field mb-3">
          <div className="flex justify-content-between align-items-center mb-1">
            <label className="font-medium m-0">{t('system_parameter.value')}</label>
            {paramForm.defaultValue !== undefined && paramForm.defaultValue !== null && (
              <Button
                type="button"
                size="small"
                text
                icon="pi pi-undo"
                label={t('system_parameter.reset_default')}
                className="w-auto p-0"
                onClick={() => {
                  setJsonError(null);
                  setParamForm((prev) => ({
                    ...prev,
                    paramValue: prev.defaultValue ?? ''
                  }));
                }}
              />
            )}
          </div>
          {renderSmartParamValueInput()}
          {paramForm.defaultValue !== undefined && paramForm.defaultValue !== null && (
            <small className="text-500 block mt-1">
              {t('system_parameter.default_value_label')}{' '}
              <span className="font-mono">{paramForm.defaultValue}</span>
            </small>
          )}
        </div>

        <div className="field mb-3">
          <label htmlFor="description" className="font-medium block mb-1">
            {t('system_parameter.description')}
          </label>
          <InputTextarea
            id="description"
            rows={2}
            value={paramForm.description || ''}
            onChange={(e) => setParamForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={t('system_parameter.description_placeholder')}
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel')}
            icon="pi pi-times"
            outlined
            className="w-auto"
            onClick={() => setShowParamDialog(false)}
          />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            className="w-auto"
            onClick={saveParam}
          />
        </div>
      </Dialog>

      {/* Modal Tab 2: Edit Code Generation Rule */}
      <Dialog
        visible={showCodeTypeDialog}
        style={{ width: '42rem' }}
        breakpoints={{ '960px': '75vw', '641px': '94vw' }}
        header={t('system_parameter.code_types.edit_title')}
        modal
        className="p-fluid"
        onHide={() => setShowCodeTypeDialog(false)}
      >
        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="codeTypeId" className="font-medium block mb-1">
              {t('system_parameter.code_types.code_type')}
            </label>
            <InputText
              id="codeTypeId"
              value={codeTypeForm.codeType || ''}
              disabled
              className="font-mono"
            />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="seqName" className="font-medium block mb-1">
              {t('system_parameter.code_types.seq_name')}
            </label>
            <InputText
              id="seqName"
              value={codeTypeForm.seqName || ''}
              disabled
              className="font-mono"
            />
          </div>
        </div>

        <div className="grid">
          <div className="col-12 md:col-4 field mb-3">
            <label htmlFor="staticPrefix" className="font-medium block mb-1">
              {t('system_parameter.code_types.prefix')}
            </label>
            <InputText
              id="staticPrefix"
              value={codeTypeForm.staticPrefix || ''}
              onChange={(e) =>
                setCodeTypeForm((prev) => ({
                  ...prev,
                  staticPrefix: e.target.value.toUpperCase()
                }))
              }
              className="font-mono"
            />
          </div>
          <div className="col-12 md:col-4 field mb-3">
            <label htmlFor="dateFormat" className="font-medium block mb-1">
              {t('system_parameter.code_types.date_format')}
            </label>
            <InputText
              id="dateFormat"
              value={codeTypeForm.dateFormat || ''}
              onChange={(e) =>
                setCodeTypeForm((prev) => ({ ...prev, dateFormat: e.target.value }))
              }
              className="font-mono"
            />
          </div>
          <div className="col-12 md:col-4 field mb-3">
            <label htmlFor="seqPadding" className="font-medium block mb-1">
              {t('system_parameter.code_types.padding')}
            </label>
            <InputNumber
              id="seqPadding"
              value={codeTypeForm.seqPadding ?? 6}
              onValueChange={(e) =>
                setCodeTypeForm((prev) => ({ ...prev, seqPadding: e.value ?? 6 }))
              }
              min={2}
              max={12}
              useGrouping={false}
            />
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="formatTemplate" className="font-medium block mb-1">
            {t('system_parameter.code_types.template')}
          </label>
          <InputText
            id="formatTemplate"
            value={codeTypeForm.formatTemplate || ''}
            onChange={(e) =>
              setCodeTypeForm((prev) => ({ ...prev, formatTemplate: e.target.value }))
            }
            className="font-mono"
          />
          {!String(codeTypeForm.formatTemplate || '').includes('{seq') && (
            <small className="text-red-500 block mt-1">
              {t('system_parameter.code_types.template_missing_seq')}
            </small>
          )}
          <div className="mt-2">
            <small className="text-600 block mb-1">
              {t('system_parameter.code_types.placeholders_hint')}
            </small>
            <div className="flex flex-wrap gap-1">
              {CODE_PLACEHOLDERS.map((token) => (
                <Button
                  key={token}
                  type="button"
                  size="small"
                  outlined
                  severity="secondary"
                  label={token}
                  className="w-auto font-mono text-xs px-2 py-1"
                  onClick={() => appendPlaceholder(token)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="field mb-3 p-3 surface-ground border-round border-1 surface-border">
          <div className="flex justify-content-between align-items-center mb-2">
            <span className="text-sm font-medium text-700">
              {t('system_parameter.code_types.live_preview_label')}
            </span>
            <Button
              type="button"
              size="small"
              text
              icon="pi pi-play"
              label={t('system_parameter.code_types.preview_refresh')}
              loading={loadingPreview}
              className="w-auto"
              onClick={() => runCodePreview(codeTypeForm)}
            />
          </div>
          <div className="font-mono text-lg text-primary font-semibold">
            {livePreview || '-'}
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="codeDescription" className="font-medium block mb-1">
            {t('system_parameter.description')}
          </label>
          <InputText
            id="codeDescription"
            value={codeTypeForm.description || ''}
            onChange={(e) =>
              setCodeTypeForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>

        <div className="field mb-3 flex align-items-center gap-3">
          <label className="font-medium m-0">{t('common.status')}</label>
          <InputSwitch
            checked={codeTypeForm.status === 1}
            onChange={(e) =>
              setCodeTypeForm((prev) => ({ ...prev, status: e.value ? 1 : 0 }))
            }
          />
          <Tag
            severity={codeTypeForm.status === 1 ? 'success' : 'secondary'}
            value={codeTypeForm.status === 1 ? t('common.active') : t('common.inactive')}
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel')}
            icon="pi pi-times"
            outlined
            className="w-auto"
            onClick={() => setShowCodeTypeDialog(false)}
          />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            className="w-auto"
            onClick={saveCodeType}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default SystemParameters;
