import React from 'react';
interface CardLayoutProps {
  styleClass?: string;
  cardTitle?: string;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  footerStyle?: React.CSSProperties;
}

const CardLayout = ({ styleClass, cardTitle, body, footer, footerStyle }: CardLayoutProps) => {
  return (
    <div className={`card ${styleClass}`}>
      {cardTitle && <h4 className="mb-6 text-center">{cardTitle}</h4>}
      <div>{body}</div>
      <div className="flex justify-content-center gap-2 mt-4" style={footerStyle}>
        <div>{footer}</div>
      </div>
    </div>
  );
};

export { CardLayout };
