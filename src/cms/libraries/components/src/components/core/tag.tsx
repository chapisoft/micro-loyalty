import React, { useEffect, useState } from 'react';

interface AppTagProps {
  severity?: 'success' | 'unsuccess' | 'lock';
  value?: string;
  style?: React.CSSProperties;
}
// BA require hardcode for this component style, this component will be updated later
const AppTag: React.FC<AppTagProps> = ({ severity = 'success', value = '', style }) => {
  const [tagStyle, setTagStyle] = useState(
    style ?? {
      color: 'var(--green-900)',
      // border: '1px solid ' + 'var(--green-900)',
      background: 'var(--green-100)',
    }
  );

  useEffect(() => {
    if (severity) getStyle();
  }, [severity]);

  useEffect(() => {
    if (style) {
      setTagStyle((prev) => ({ ...prev, ...style }));
    }
  }, [style]);

  const getStyle = () => {
    switch (severity) {
      case 'success':
        setTagStyle({
          color: 'var(--green-900)',
          // border: '1px solid ' + 'var(--green-900)',
          background: 'var(--green-100)',
        });
        break;
      case 'unsuccess':
        setTagStyle({
          color: 'var(--bluegray-900)',
          // border: '1px solid ' + 'var(--bluegray-900)',
          background: 'var(--bluegray-50)',
        });
        break;
      case 'lock':
        setTagStyle({
          color: 'var(--red-900)',
          // border: '1px solid ' + 'var(--red-900)',
          background: 'var(--red-100)',
        });
        break;
      default:
        setTagStyle({});
        break;
    }
  };

  return (
    <div
      className="text-center font-medium text-sm inline"
      style={{
        width: 'fit-content',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        lineHeight: 'initial',
        ...tagStyle,
      }}
    >
      {value}
    </div>
  );
};

export { AppTag };
