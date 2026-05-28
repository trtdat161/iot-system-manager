// src/components/common/Portal.jsx
import { createPortal } from "react-dom";

export function Portal({ children }) {
  return createPortal(children, document.body);
}
