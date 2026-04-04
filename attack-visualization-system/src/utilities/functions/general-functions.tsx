
export function isEmpty(arr: Array<unknown>) {
    return arr.length === 0;
}

export function isNumber(string: string) {
    return string.match(/^[0-9]+$/);
}

export function isSpecialChars(str: string) {
    return str.length === 1 && str.match(/^[!@#$%^&*()_+\-=[]{};":"\\|,.<>\/?]*$/);
}

export function leftPadZero(n: number) {
    return n < 10 ? "0" + n : n.toString();
}

export function randomizer(length: number): string {
    const len = Math.max(0, Math.floor(length));
    if (len === 0) return "";

    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const charsLen = chars.length;

    const cryptoObj = globalThis.crypto;

    if (!cryptoObj || !cryptoObj.getRandomValues) {
        throw new Error("The environment does not support a Cryptographically Secure Random Number Generator (CSPRNG).");
    }

    let result = "";
    const maxValid = 256 - (256 % charsLen);
    
    const buffer = new Uint8Array(Math.ceil(len * 1.3)); 

    while (result.length < len) {
        cryptoObj.getRandomValues(buffer);
        for (let i = 0; i < buffer.length && result.length < len; i++) {
            if (buffer[i] < maxValid) {
                result += chars[buffer[i] % charsLen];
            }
        }
    }

    return result;
}

export const reload = async () => {
    await sleep(1000);
    window.location.reload();
};

export function removeAllSpaces(str: string) {
    return str.replace(/\s/g, "");
}

export function removeVietnameseTones(str: string): string {
    if (!str) return "";

    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^A-Za-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function shuffle(array: []) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function toSQLDateTime(dateObj: any) {
    if (!dateObj) return new Date().toISOString().slice(0, 19).replace("T", " ");
    const date = typeof dateObj === "string" ? new Date(dateObj) : dateObj;
    // Chuyển về dạng: "YYYY-MM-DD HH:MM:SS"
    return date.toISOString().slice(0, 19).replace("T", " ");
};

export function getTime(date: any) {
    if (!date) return 0;
    // Nếu là Firestore Timestamp có phương thức toDate
    if (typeof date.toDate === 'function') {
        return date.toDate().getTime();
    }
    // Nếu là string, number, hoặc Date hợp lệ
    return new Date(date).getTime();
};