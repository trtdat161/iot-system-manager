import { FaSignOutAlt } from "react-icons/fa";
import { Portal } from "./Portal";
import "../../css/ConfirmDialog.css";

export function ConfirmDialog({
  open,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <Portal>
      <div className="confirm-dialog-backdrop" onMouseDown={onCancel}>
        <div
          className="confirm-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="confirm-dialog-icon" aria-hidden="true">
            <FaSignOutAlt />
          </div>
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{message}</p>
          <div className="confirm-dialog-actions">
            <button
              type="button"
              className="confirm-dialog-cancel"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="confirm-dialog-confirm"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
