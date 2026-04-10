import bcrypt from "bcrypt";

export const PasswordUtils = {
    hash: async (plain: string, saltRounds: number = 10) => await bcrypt.hash(plain, saltRounds),
    compare: async (plain: string, hash: string) => await bcrypt.compare(plain, hash),
    validateStrength: (password: string) => {
        const minLength = 12; // Chuẩn an toàn hiện nay thường là >= 12
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            throw new Error("Mật khẩu không đủ độ mạnh theo chính sách an toàn.");
        }
    }
};