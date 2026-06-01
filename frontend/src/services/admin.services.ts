import { HttpClient } from "./HttpClient";
import type { ICreateUserRequest, IUserResponse } from "@attack-visualization-system/shared";

export const getUsers = async (): Promise<IUserResponse[]> => {
    const result = await HttpClient.get("/admin/users");
    return result.data.users ?? result.data;
};

export const createUser = async (data: ICreateUserRequest): Promise<IUserResponse> => {
    const result = await HttpClient.post("/admin/user/create", data);
    return result.data.user;
};

export const updateUserStatus = async (id: string, status: string): Promise<void> => {
    await HttpClient.patch(`/admin/users/${id}`, { status });
};

export const updateUserRole = async (id: string, role: string): Promise<void> => {
    await HttpClient.patch(`/admin/users/${id}`, { role });
};
