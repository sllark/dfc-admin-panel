import toast from "react-hot-toast";
import { clearAuthSession } from "@/app/lib/authSession";

export const handleApiError = (error, options = {}) => {
  const {
    notFoundMessage = "Requested resource was not found.",
    defaultMessage = "Something went wrong. Please try again.",
  } = options;

  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (status === 401 && typeof window !== "undefined") {
    clearAuthSession();
    toast.error("Your session has expired. Please sign in again.");
    window.location.replace("/");
    return;
  }

  let message = serverMessage;
  if (!message) {
    if (status === 400) message = "Request failed. Please check your input and try again.";
    else if (status === 403) message = "You do not have permission to perform this action.";
    else if (status === 404) message = notFoundMessage;
    else if (status >= 500) message = "Server error. Please retry shortly or contact support.";
    else message = error?.message || defaultMessage;
  }

  toast.error(message);
};
