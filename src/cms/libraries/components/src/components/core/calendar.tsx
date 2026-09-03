import classNames from 'classnames';
import { isDate } from 'is-what';
import { Calendar, CalendarProps } from 'primereact/calendar';
import React, { useEffect, useRef } from 'react';
import './calendar.scss';
import { AppLabel, AppLabelProps } from './label';
import { isString } from 'is-what';
export type AppDate = Date | (Date | null)[] | null | any;

type newProps = {
  showClear?: boolean;
  iconClass?: string;
  onChange?: (date: AppDate) => void;
};

type AppCalendarProps = Omit<CalendarProps<any, any>, 'onChange'> & AppLabelProps & newProps & { selectionMode?: 'single' | 'multiple' | 'range' };

const AppCalendar: React.FC<AppCalendarProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  showClear = true,
  iconClass = '',
  selectionMode = 'single',
  ...props
}: AppCalendarProps) => {
  const button = document
    .getElementsByClassName('p-calendar-w-btn-right')[0]
    ?.getElementsByClassName('p-datepicker-trigger')[0] as HTMLElement;
  const [buttonWidth, setButtonWidth] = React.useState<number>(button?.offsetWidth ?? 0);
  const [value, setValue] = React.useState<AppDate>(props.value ?? null);

  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<Calendar>(null);

  const handleClear = () => {
    setValue(null);
    props.onChange?.(null);
  };

  const updateInput = () => {
    inputRef.current?.blur();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const hideOverlay = () => {
    calendarRef.current?.hide();
  };

  const handleChange = (event: any) => {
    const value = event.value;
    if (value?.length === 8 && selectionMode === 'single' && !value.includes('/')) {
      const date = getDate(value);
      if (date && !isNaN(date.getTime())) {
        setValue(date ?? null);
        props.onChange?.(date);
        inputRef.current?.blur();
        hideOverlay();
      }
    }
    if (value?.length === 8 && selectionMode === 'range' && !value.includes('/')) {
      const start = getDate(value);
      if (start && !isNaN(start.getTime())) {
        setValue([start, null]);
        props.onChange?.([start, null]);
        updateInput();
      }
    }

    if (isString(value)) {
      const n = value?.length;
      const startStr = value
        ?.slice(0, n - 8)
        .split('/')
        .join('');
      const endStr = value?.slice(Math.max(n - 8, 9), n);

      if (
        n >= 17 &&
        n <= 21 &&
        selectionMode === 'range' &&
        value.includes('-') &&
        regex.test(startStr.slice(0, 8)) &&
        regex.test(endStr)
      ) {
        const start = getDate(startStr);
        const end = getDate(endStr);

        if (end && start && !isNaN(end.getTime()) && !isNaN(start.getTime())) {
          setValue([start, end]);
          props.onChange?.([start, end]);
          inputRef.current?.blur();
          hideOverlay();
        }
      }
    }

    if (
      (selectionMode === 'single' && isDate(value)) ||
      (selectionMode === 'range' && isDate(value[0])) ||
      isDate(value[1])
    ) {
      setValue(value);
      props.onChange?.(value);
    }
  };

  const regex: RegExp = new RegExp(/^[0-9]*$/);

  const getDate = (value: string) => {
    return new Date(value.slice(4, 8) + '/' + value.slice(2, 4) + '/' + value.slice(0, 2));
  };

  useEffect(() => {
    const button = document
      .getElementsByClassName('p-calendar-w-btn-right')[0]
      ?.getElementsByClassName('p-datepicker-trigger')[0] as HTMLElement;
    if (button) {
      setButtonWidth(button.offsetWidth);
    }
  }, []);

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  return (
    <AppLabel
      inputId={inputId}
      label={label}
      required={required}
      error={error}
      disabled={disabled}
      caption={caption}
      showCaption={showCaption}
    >
      <span
        className={classNames({
          'p-input-icon-left': iconClass.length > 0,
          'p-input-icon-right': showClear && value,
        })}
      >
        <Calendar
          ref={calendarRef}
          inputRef={inputRef}
          dateFormat="dd/mm/yy"
          icon={() => <i className="pi pi-calendar" id="app-calendar-icon" />}
          invalid={Boolean(error)}
          keepInvalid
          hideOnRangeSelection
          showOnFocus={false}
          disabled={disabled}
          showIcon
          {...props}
          value={value}
          selectionMode={selectionMode}
          onChange={handleChange}
          className={`w-full ${props.className ?? ''}`}
          inputClassName={`white-space-nowrap text-overflow-ellipsis pr-5-5 ${error ? 'ng-invalid ng-dirty' : ''}`}
        ></Calendar>
        {showClear && value && !disabled && button && (
          <i
            className="pi pi-times cursor-pointer"
            style={{ right: `calc(0.75rem + ${buttonWidth}px)` }}
            onClick={handleClear}
          ></i>
        )}
      </span>
    </AppLabel>
  );
};
export { AppCalendar };
