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







  //  toast("Login", {
  //       className: "my-classname",
  //       description: "Exitoso",
  //       duration: 1500,
  //       position: "top-center",
  //       style: {
  //         background: "#000",
  //         color: "white",
  //       },
  //       // icon: <MyIcon />,
  //     });