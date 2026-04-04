export interface IUser {
    id: string;
    username: string;
    displayName: string;
    role: "admin" | "operator";
    lastLogin: string;
}