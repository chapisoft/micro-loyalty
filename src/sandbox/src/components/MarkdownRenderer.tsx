import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { Copy, Check, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CodeBlockContext = createContext(false);

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current && chart) {
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        mermaid
          .render(id, chart)
          .then(({ svg }) => {
            if (ref.current) {
              ref.current.innerHTML = svg;
              setError(null);
            }
          })
          .catch((err) => {
            console.error('Mermaid render error:', err);
            setError('Không thể hiển thị sơ đồ Mermaid.');
          });
      } catch (err: any) {
        setError(err.message || 'Lỗi sơ đồ');
      }
    }
  }, [chart]);

  if (error) {
    return (
      <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: '13px', margin: '16px 0' }}>
        {error}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '24px 0',
        overflowX: 'auto',
        backgroundColor: '#FFFFFF',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}
    />
  );
};

const PreRenderer = ({ children, ...props }: any) => {
  const childArray = React.Children.toArray(children);
  const firstChild = childArray[0] as any;
  const className = firstChild?.props?.className || '';

  if (className.includes('language-mermaid')) {
    const chart = String(firstChild.props.children).replace(/\n$/, '');
    return <Mermaid chart={chart} />;
  }

  const [copied, setCopied] = useState(false);
  const rawCode = String(firstChild?.props?.children || '').replace(/\n$/, '');
  const langMatch = /language-(\w+)/.exec(className);
  const lang = langMatch ? langMatch[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', margin: '20px 0' }}>
      {/* Code Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1E293B',
        borderTopLeftRadius: '10px',
        borderTopRightRadius: '10px',
        padding: '8px 16px',
        borderBottom: '1px solid #334155'
      }}>
        <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', fontWeight: 600 }}>
          {lang || 'CODE'}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: copied ? '#4ADE80' : '#CBD5E1',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500
          }}
        >
          {copied ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
          <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
        </button>
      </div>

      <pre
        style={{
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          padding: '16px',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
          overflowX: 'auto',
          fontSize: '13px',
          fontFamily: 'JetBrains Mono, monospace',
          lineHeight: 1.6,
          margin: 0
        }}
        {...props}
      >
        <CodeBlockContext.Provider value={true}>
          {children}
        </CodeBlockContext.Provider>
      </pre>
    </div>
  );
};

const CodeRenderer = ({ className, children, ...props }: any) => {
  const isBlock = useContext(CodeBlockContext);
  const match = /language-(\w+)/.exec(className || '');
  const isMermaid = match && match[1] === 'mermaid';

  if (isMermaid) {
    return <Mermaid chart={String(children).replace(/\n$/, '')} />;
  }

  if (isBlock) {
    return <code className={className} style={{ fontFamily: 'inherit' }} {...props}>{children}</code>;
  }

  // Inline code
  return (
    <code
      style={{
        backgroundColor: '#FFF7ED',
        color: '#EA580C',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '13px',
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 600,
        border: '1px solid #FFEDD5'
      }}
      className={className || ''}
      {...props}
    >
      {children}
    </code>
  );
};

export const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;

  return (
    <div className="markdown-body" style={{ color: '#1E293B', fontSize: '14px', lineHeight: 1.75 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: PreRenderer,
          code: CodeRenderer,
          h1({ children, ...props }: any) {
            return (
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                  marginTop: '28px',
                  marginBottom: '16px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #FED7AA'
                }}
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ children, ...props }: any) {
            return (
              <h2
                style={{
                  fontSize: '19px',
                  fontWeight: 700,
                  color: '#0F172A',
                  letterSpacing: '-0.01em',
                  marginTop: '24px',
                  marginBottom: '12px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #E2E8F0'
                }}
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3({ children, ...props }: any) {
            return (
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#EA580C',
                  marginTop: '20px',
                  marginBottom: '10px'
                }}
                {...props}
              >
                {children}
              </h3>
            );
          },
          p({ children, ...props }: any) {
            return (
              <p style={{ marginBottom: '14px', color: '#334155' }} {...props}>
                {children}
              </p>
            );
          },
          table({ children, ...props }: any) {
            return (
              <div style={{ overflowX: 'auto', margin: '20px 0', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }} {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ children, ...props }: any) {
            return <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }} {...props}>{children}</thead>;
          },
          th({ children, ...props }: any) {
            return (
              <th style={{ padding: '10px 14px', fontWeight: 600, color: '#334155', borderBottom: '1px solid #E2E8F0' }} {...props}>
                {children}
              </th>
            );
          },
          td({ children, ...props }: any) {
            return (
              <td style={{ padding: '10px 14px', color: '#475569', borderBottom: '1px solid #F1F5F9' }} {...props}>
                {children}
              </td>
            );
          },
          blockquote({ children, ...props }: any) {
            return (
              <blockquote
                style={{
                  borderLeft: '4px solid #FF6B00',
                  backgroundColor: '#FFF7ED',
                  padding: '12px 18px',
                  borderRadius: '0 8px 8px 0',
                  margin: '18px 0',
                  color: '#9A3412',
                  fontSize: '13px'
                }}
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          ul({ children, ...props }: any) {
            return (
              <ul style={{ paddingLeft: '22px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }} {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }: any) {
            return (
              <ol style={{ paddingLeft: '22px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }} {...props}>
                {children}
              </ol>
            );
          },
          li({ children, ...props }: any) {
            return (
              <li style={{ color: '#334155' }} {...props}>
                {children}
              </li>
            );
          },
          a({ children, href, ...props }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0284C7', textDecoration: 'underline', fontWeight: 500 }}
                {...props}
              >
                {children}
              </a>
            );
          },
          hr({ ...props }: any) {
            return <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '24px 0' }} {...props} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
