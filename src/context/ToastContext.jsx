import React, { createContext, useContext } from "react";
import toast from "react-hot-toast";

const ToastContext = createContext({
  addToast: () => {},
});

export const ToastProvider = ({ children }) => {
  const addToast = (message, type = "success", duration = 4500) => {
    switch (type) {
      case "error":
      case "danger":
        return toast.error(message, { duration });
      case "warning":
        return toast(message, {
          duration,
          icon: "⚠️",
          style: {
            background: "#FFFBEB",
            color: "#92400E",
            border: "1px solid #FCD34D",
          },
        });
      case "info":
        return toast(message, {
          duration,
          icon: "ℹ️",
          style: {
            background: "#EFF6FF",
            color: "#1E40AF",
            border: "1px solid #93C5FD",
          },
        });
      case "success":
      default:
        return toast.success(message, { duration });
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
