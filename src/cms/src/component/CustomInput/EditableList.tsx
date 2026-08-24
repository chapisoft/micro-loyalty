import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Controller, useFieldArray } from 'react-hook-form';

interface EditableListProps {
  control: any;
  name: string;
  disabled?: boolean;
}

const EditableList: React.FC<EditableListProps> = ({ control, name, disabled }) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name,
  });

  const handleRemove = (index: number, field: any) => {
    if (field.type === 'create') {
      remove(index); // just remove if it's not yet persisted
    } else {
      // mark for deletion instead of removing
      update(index, { ...field, type: 'delete' });
    }
  };

  return (
    <div className="p-fluid">
      {fields.map((field, index) =>
        field.type === 'delete' ? null : ( // skip rendering deleted fields
          <div key={field.id} className="p-inputgroup mb-2">
            <Controller
              control={control}
              name={`${name}.${index}.value`}
              defaultValue={field.value}
              render={({ field }) => <InputText {...field} disabled={disabled} placeholder={`Item ${index + 1}`} />}
            />
            <Button
              icon="pi pi-trash"
              className="p-button-danger"
              onClick={() => handleRemove(index, field)}
              disabled={disabled}
              type="button"
            />
          </div>
        )
      )}
      <Button
        icon="pi pi-plus"
        label="Add Item"
        className="p-button-sm p-button-outlined"
        onClick={() => append({ type: 'create', value: '' })}
        disabled={disabled}
        type="button"
      />
    </div>
  );
};

export default EditableList;
