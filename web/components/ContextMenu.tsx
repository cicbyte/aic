import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, x, y, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw) x = vw - rect.width - 8;
    if (rect.bottom > vh) y = vh - rect.height - 8;
    if (x < 0) x = 8;
    if (y < 0) y = 8;
  }, [x, y]);

  return (
    <div
      ref={ref}
      className="fixed z-[100] min-w-[160px] py-1 bg-popover border border-border rounded-lg shadow-lg animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item.divider && <div className="my-1 border-t border-border" />}
          <button
            onClick={() => { item.onClick(); onClose(); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
              item.danger
                ? 'text-destructive hover:bg-destructive/10'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export function useContextMenu() {
  const [state, setState] = React.useState<{ items: ContextMenuItem[]; x: number; y: number } | null>(null);

  const show = (e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setState({ items, x: e.clientX, y: e.clientY });
  };

  const close = () => setState(null);

  const menu = state ? <ContextMenu items={state.items} x={state.x} y={state.y} onClose={close} /> : null;

  return { show, close, menu };
}
