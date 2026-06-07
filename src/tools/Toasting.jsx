import { toast } from 'sonner'


export const ToastSuccess = (text) => {
  toast.success(text, {
    icon: "😃",
    duration: 2000, // ⬅️ reemplaza autoClose
  });
};

export const ToastSuccessFirma = (text) => {
  toast.success(text, {
    duration: 2000,
  });
};

export const ToastError = (text) => {
  toast.error(text, {
    icon: "😕",
    duration: 15000,
  });
};

export const ToastWarning = (text) => {
  toast.warning(text, {
    duration: 10000,
  });
};






