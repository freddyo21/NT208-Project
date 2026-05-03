// Validate DECIMAL(9,6): max 9 chữ số, 6 chữ số thập phân
export const decimal96 = (num: number) => {
    const str = Math.abs(num).toFixed(6); // Làm tròn 6 chữ số
    return str.replace('.', '').length <= 9; // Loại bỏ dấu . và kiểm tra tổng
};