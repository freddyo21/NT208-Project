import { randomUUID } from "node:crypto";
import { emitAttackEvent, SocketAttackEvent } from "../websocket";

type SourceLocation = {
    city: string;
    country: string;
    srcLat: number;
    srcLng: number;
};

// Danh sach toa do demo de event attack bay tu nhieu noi tren ban do.
// Phan nay chi phuc vu demo realtime, chua phai data that tu database/IDS.
const sampleSources: [SourceLocation, ...SourceLocation[]] = [
    { city: "Sofia", country: "BG", srcLat: 42.7, srcLng: 23.3 },
    { city: "Bucharest", country: "RO", srcLat: 44.4, srcLng: 26.1 },
    { city: "Jakarta", country: "ID", srcLat: -6.2, srcLng: 106.8 },
    { city: "Hanoi", country: "VN", srcLat: 21.0, srcLng: 105.8 },
    { city: "Cairo", country: "EG", srcLat: 30.1, srcLng: 31.2 },
    { city: "London", country: "GB", srcLat: 51.5, srcLng: -0.1 },
    { city: "New York", country: "US", srcLat: 40.7, srcLng: -74.0 },
    { city: "Sao Paulo", country: "BR", srcLat: -23.5, srcLng: -46.6 },
    { city: "Johannesburg", country: "ZA", srcLat: -26.2, srcLng: 28.0 },
    { city: "Tokyo", country: "JP", srcLat: 35.7, srcLng: 139.7 },
    { city: "Seoul", country: "KR", srcLat: 37.6, srcLng: 127.0 },
    { city: "Sydney", country: "AU", srcLat: -33.9, srcLng: 151.2 },
    { city: "Mumbai", country: "IN", srcLat: 19.1, srcLng: 72.9 },
    { city: "Frankfurt", country: "DE", srcLat: 50.1, srcLng: 8.7 },
    { city: "Toronto", country: "CA", srcLat: 43.7, srcLng: -79.4 },
    { city: "Mexico City", country: "MX", srcLat: 19.4, srcLng: -99.1 },
    { city: "Istanbul", country: "TR", srcLat: 41.0, srcLng: 29.0 },
    { city: "Bangkok", country: "TH", srcLat: 13.8, srcLng: 100.5 }
];

// Lay random mot source de moi lan bam TRIGGER ATTACK nhin khac nhau.
const pickSource = () => sampleSources[Math.floor(Math.random() * sampleSources.length)] ?? sampleSources[0];

type AttackInput = {
    // input den tu req.body cua POST /api/v1/attacks.
    // De an toan, ban dau coi tat ca field la unknown roi moi validate nhe.
    type?: unknown;
    severity?: unknown;
    sourceIp?: unknown;
    assetId?: unknown;
    [key: string]: unknown;
};

const readString = (value: unknown, fallback: string): string => {
    // Neu client gui string hop le thi dung string do.
    // Neu khong gui hoac gui sai kieu thi dung fallback de demo khong bi crash.
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

export const attack = async (input: AttackInput = {}): Promise<SocketAttackEvent> => {
    // Tao event attack demo tu body REST API.
    // Sau nay neu co IDS/database that thi co the thay phan tao event nay.
    const source = pickSource();
    const timestamp = new Date().toISOString();
    const type = readString(input.type, "DDOS");
    const severity = readString(input.severity, "HIGH");
    const sourceIp = readString(input.sourceIp, "192.168.1.10");

    const event: SocketAttackEvent = {
        ...input,
        id: randomUUID(),
        type,
        severity,
        sourceIp,

        // ip/time/city/country/srcLat/srcLng la cac field Dashboard hien tai can de ve map.
        ip: sourceIp,
        assetId: readString(input.assetId, "socket-flow-demo"),
        timestamp,
        time: new Date(timestamp).toTimeString().slice(0, 8),
        city: source.city,
        country: source.country,
        srcLat: source.srcLat,
        srcLng: source.srcLng,
        desc: `${type} activity detected from ${sourceIp}`
    };

    // Day la dong quan trong cua WebSocket:
    // REST API nhan attack -> service tao event -> Socket.IO broadcast attack:new.
    emitAttackEvent(event);

    return event;
};
