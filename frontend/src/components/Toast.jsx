import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

let _toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Stable API: toast.success/error/info
  const toastRef = useRef(null);
  if (!toastRef.current) {
    toastRef.current = { success: () => {}, error: () => {}, info: () => {} };
  }
  toastRef.current.success = (msg) => addToast(msg, "success");
  toastRef.current.error = (msg) => addToast(msg, "error");
  toastRef.current.info = (msg) => addToast(msg, "info");

  return (
    <ToastContext.Provider value={toastRef.current}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === "success" ? "OK" : t.type === "error" ? "X" : "i"}
            </span>
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

