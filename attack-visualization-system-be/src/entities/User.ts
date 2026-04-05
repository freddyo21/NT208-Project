import { PasswordUtils } from "../utils/security.utility";

export type UserRole = "admin" | "operator";

interface UserProperties {
    id: string;
    username: string;
    password_hash: string;
    role: UserRole;
    created_at: Date;
}

export class User {
    private _id: string;
    private _username: string;
    private _passwordHash: string;
    private _role: UserRole;
    private readonly _createdAt: Date;

    constructor(data: UserProperties) {
        this.validateUsername(data.username);

        this._id = data.id;
        this._username = data.username;
        this._passwordHash = data.password_hash;
        this._role = data.role;
        this._createdAt = data.created_at;
    }

    private validateUsername(username: string) {
        if (!username || username.trim().length === 0) {
            throw new Error("Username cannot be empty");
        }
        if (username.length > 50) {
            throw new Error("Username must be <= 50 characters");
        }
    }

    public get id(): string {
        return this._id;
    }

    public get username(): string {
        return this._username;
    }

    public get role(): UserRole {
        return this._role;
    }

    public get passwordHash(): string {
        return this._passwordHash;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    /**
     * Factory method để tạo User mới từ plaintext password
     */
    public static async create(data: Omit<UserProperties, "password_hash"> & { password: string }): Promise<User> {
        // Có thể thêm bước validate độ mạnh password ở đây
        PasswordUtils.validateStrength(data.password);
        const passwordHash = await PasswordUtils.hash(data.password, 13);

        const { password, ...rest } = data;

        return new User({
            ...rest,
            password_hash: passwordHash
        });
    }

    public async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        const isValid = await PasswordUtils.compare(oldPassword, this._passwordHash);

        if (!isValid) {
            throw new Error("Invalid current password");
        }

        PasswordUtils.validateStrength(newPassword);

        if (oldPassword === newPassword) {
            throw new Error("New password must be different from the old one");
        }

        this._passwordHash = await PasswordUtils.hash(newPassword, 13);
    }
}