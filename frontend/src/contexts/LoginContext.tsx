import { ILoginContext } from "@/types/interfaces/ILoginContext";
import { createContext } from "react";

export const LoginContext = createContext<ILoginContext | null>(null);