'use client';

type Props = {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ title, description, confirmLabel = 'Confirmar', onConfirm, onCancel }: Props) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <div className="text-2xl mb-1">⚠️</div>
        <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-1">{title}</h3>
        {description && <p className="text-sm text-[var(--text-muted)] mb-5">{description}</p>}
        <div className="flex gap-3 mt-5">
          <button className="btn btn-secondary flex-1" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger flex-1" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
