export interface ITarget {
    id: string; // UUID v7
    ipAddress: string;
    lat: number;
    lng: number;
    description?: string;
}