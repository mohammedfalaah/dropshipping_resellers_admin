import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success", duration = 4500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastClass = (type) => {
    switch (type) {
      case "error":
      case "danger":
        return "bg-danger text-white";
      case "warning":
        return "bg-warning text-dark";
      case "info":
        return "bg-info text-dark";
      case "success":
      default:
        return "bg-dark text-white";
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "error":
      case "danger":
        return <i className="fa-solid fa-circle-xmark text-white me-2 fs-6"></i>;
      case "warning":
        return <i className="fa-solid fa-triangle-exclamation text-dark me-2 fs-6"></i>;
      case "info":
        return <i className="fa-solid fa-circle-info text-dark me-2 fs-6"></i>;
      case "success":
      default:
        return <i className="fa-solid fa-circle-check text-success me-2 fs-6"></i>;
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="toast-container position-fixed bottom-0 end-0 p-3"
        style={{ zIndex: 9999, maxWidth: "420px" }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast show align-items-center ${getToastClass(toast.type)} border-0 mb-2 shadow-lg`}
            role="alert"
            style={{ borderRadius: "12px", minWidth: "300px" }}
          >
            <div className="d-flex align-items-center p-3">
              <div className="toast-body flex-grow-1 p-0 d-flex align-items-start" style={{ fontSize: "14px", fontWeight: "500", lineHeight: "1.4" }}>
                {getToastIcon(toast.type)}
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                className={`btn-close ${toast.type === "warning" || toast.type === "info" ? "" : "btn-close-white"} ms-2 me-0`}
                onClick={() => removeToast(toast.id)}
                aria-label="Close"
              ></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
