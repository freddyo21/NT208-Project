import { LoginContext } from "@/contexts/LoginContext";
import { useContext } from "react";

// Hook để các component khác gọi cho lẹ
export const useLogin = () => {
    const context = useContext(LoginContext);
    if (!context) throw new Error("useLogin must be used within an FirebaseAuthProvider");
    return context;
};