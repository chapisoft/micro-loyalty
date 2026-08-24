import { AppSelect } from 'components';
import { t } from 'i18next';
import { ColumnFilterElementTemplateOptions } from 'primereact/column';

const useFilter = () => {
  const selectFilter = (
    options: ColumnFilterElementTemplateOptions,
    filterOptions: {
      name: string;
      value: string | boolean | number;
    }[]
  ) => {
    const modifiedOptions = [{ value: '', name: t('all') }, ...filterOptions];
    const selectedValue = options.value || '';
    return (
      <AppSelect
        value={selectedValue}
        options={modifiedOptions}
        optionLabel="name"
        optionValue="value"
        showClear={selectedValue !== ''}
        onChange={(e) => {
          options.filterApplyCallback(e.target.value);
        }}
      />
    );
  };

  return { selectFilter };
};

export default useFilter;
