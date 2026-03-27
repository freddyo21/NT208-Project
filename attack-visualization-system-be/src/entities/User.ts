import bcrypt from "bcrypt";

export type UserRole = "admin" | "operator";

interface UserProperties {
    id: string;
    username: string;
    password_hash: string;
    role: UserRole;
    created_at: Date;
}

export class User {
    public id: string;
    public username: string;
    private _passwordHash: string;
    public role: UserRole;
    public readonly created_at: Date;

    constructor(data: UserProperties = {
        id: "",
        username: "",
        password_hash: "",
        role: "operator",
        created_at: new Date()
    }) {
        this.validateUsername(data.username);
        this.id = data.id;
        this.username = data.username;
        this._passwordHash = data.password_hash;
        this.role = data.role;
        this.created_at = data.created_at;
    }

    private validateUsername(username: string): void {
        if (!username || username.trim().length === 0) {
            throw new Error("Username cannot be empty");
        }
        if (username.length > 50) {
            throw new Error("Username must be <= 50 characters");
        }
    }

    public get passwordHash(): string {
        return this._passwordHash;
    }

    /**
     * Factory method để tạo User mới từ plaintext password
     */
    public static async create(data: Omit<UserProperties, "password_hash"> & { password: string }): Promise<User> {
        // Có thể thêm bước validate độ mạnh password ở đây
        const passwordHash = await this.hashPassword(data.password, 13);
        return new User({
            ...data,
            password_hash: passwordHash
        });
    }

    public static async hashPassword(password: string, saltRounds: number = 10): Promise<string> {
        return await bcrypt.hash(password, saltRounds);
    }

    public async validatePassword(password: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, this._passwordHash);
        } catch (error) {
            // Log error tại đây nếu cần thiết cho mục đích Audit
            throw new Error("Password validation failed");
        }
    }

    public async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        const isValid = await this.validatePassword(oldPassword);
        if (!isValid) {
            throw new Error("Old password is incorrect");
        }

        if (oldPassword === newPassword) {
            throw new Error("New password must be different from the old one");
        }

        this._passwordHash = await User.hashPassword(newPassword, 13);
    }

    public toJSON() {
        return {
            id: this.id,
            username: this.username,
            role: this.role,
            created_at: this.created_at
        };
    }
}