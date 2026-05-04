import { z } from "zod";
import { EAttackTypes } from "../types";
import { decimal96 } from "../utils";

const SummaryDataSchema = z.object({
    totalAttacks: z.number().nonnegative(),
    topAttackType: z.enum(EAttackTypes),
    topSourceIp: z.ipv4().or(z.ipv6()),
    // active_sensors: z.number(),
});

const TimelineDataSchema = z.array(z.object({
    timestamp: z.iso.datetime(), // ISO 8601
    count: z.number().int().nonnegative(),
})).min(0);

const GeoMapDataSchema = z.array(z.object({
    countryCode: z.string().length(2), // VD: "VN", "US"
    countryName: z.string().min(4).max(56), // Tên quốc gia, tối đa 56 ký tự (The United Kingdom of Great Britain and Northern Ireland)
    // Tọa độ tấn công nhận được
    lat: z.coerce.number()
        .min(-90).max(90)
        .refine(decimal96, "Latitude must be DECIMAL(9,6)"),
    lng: z.coerce.number()
        .min(-180).max(180)
        .refine(decimal96, "Longitude must be DECIMAL(9,6)"),
    count: z.number().int().nonnegative(),
    intensity: z.number().min(0).max(1), // Dùng cho Heatmap
})).min(0);

export const AttackStatsRequestSchema = z.object({
    type: z.enum(["summary", "timeline", "geomap"]),
    range: z.union([
        z.literal(3600),    // 1 hour,
        z.literal(86400),   // 1 day,
        z.literal(604800),  // 1 week,
        z.literal(1209600), // 2 weeks,
        z.literal(2592000)  // 1 month (30 days)
    ]), // in seconds
    attackType: z.enum(EAttackTypes).optional(),
}).strict();

// Schema tổng hợp (Discriminated Union)
// Giúp TypeScript tự gợi ý field dựa trên giá trị của "type"
export const AttackStatsResponseSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("summary"), data: SummaryDataSchema }),
    z.object({ type: z.literal("timeline"), data: TimelineDataSchema }),
    z.object({ type: z.literal("geomap"), data: GeoMapDataSchema }),
]);