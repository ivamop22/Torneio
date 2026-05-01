'use client';
import { useEffect } from 'react';

type Props = {
  message: string;
  type: 'ok' | 'err';
  onClose: () => void;
};

export function Toast({ message, type, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast ${type === 'ok' ? 'toast-ok' : 'toast-err'}`}>
      <span className="text-lg">{type === 'ok' ? '✓' : '✕'}</span>
      <span>{message}</span>
    </div>
  );
}
