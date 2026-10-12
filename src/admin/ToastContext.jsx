import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
} from "react-icons/fa";

const ToastContext = createContext(null);

const ICONS = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  info: FaInfoCircle,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));

    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, type = "info", duration = 4200) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((current) => [...current, { id, message, type }]);

      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );

      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error"),
      info: (message) => push(message, "info"),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="admin-toasts" role="status" aria-live="polite">
        {toasts.map((item) => {
          const Icon = ICONS[item.type] || FaInfoCircle;

          return (
            <div key={item.id} className={`admin-toast ${item.type}`}>
              <Icon />

              <p>{item.message}</p>

              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};
