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

    private static validatePasswordStrength(password: string) {
        const minLength = 12; // Chuẩn an toàn hiện nay thường là >= 12
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            throw new Error("Mật khẩu không đủ độ mạnh theo chính sách an toàn.");
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
        this.validatePasswordStrength(data.password);
        const passwordHash = await this.hashPassword(data.password, 13);

        const { password, ...rest } = data;

        return new User({
            ...rest,
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
            throw new Error("Invalid username or password");
        }
    }

    public async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        const isValid = await this.validatePassword(oldPassword);
        if (!isValid) {
            throw new Error("Invalid current password");
        }

        User.validatePasswordStrength(newPassword);

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
            createdAt: this.createdAt
        };
    }
}