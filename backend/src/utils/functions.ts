import { randomBytes } from "crypto";

export const createUUIDv7 = (): string => {
    const timestamp = Date.now();   // 48-bit timestamp
    const entropy = randomBytes(10); // 80 bit ngẫu nhiên

    // 1. Chuyển timestamp thành hex (12 ký tự hex = 48 bit)
    const timeHex = timestamp.toString(16).padStart(12, "0");

    // 2. Thiết lập Version 7 (4 bits)
    // Nhóm thứ 3 trong UUID: "7xxx"
    // Ta lấy 12 bit ngẫu nhiên từ entropy cho rand_a
    const randA = (entropy.readUInt16BE(0) & 0x0fff) | 0x7000;

    // 3. Thiết lập Variant (2 bits - chuẩn RFC là 10xx)
    // Nhóm thứ 4 trong UUID: "8xxx" đến "bxxx"
    const randBHigh = (entropy.readUint8(2) & 0x3f) | 0x80;
    
    // 4. Các byte còn lại cho rand_b
    const randBLow = entropy.subarray(3).toString("hex");

    return [
        timeHex.slice(0, 8),               // 32-bit time high
        timeHex.slice(8, 12),              // 16-bit time low
        randA.toString(16).padStart(4, "0"), // 4-bit version + 12-bit randomness
        (randBHigh.toString(16) + entropy.subarray(2, 3).toString("hex").slice(1)).padStart(4, "0"), // 2-bit variant + randomness
        randBLow.slice(0, 12)              // 48-bit randomness còn lại
    ].join("-");
};