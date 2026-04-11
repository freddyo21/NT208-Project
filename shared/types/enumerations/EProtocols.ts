export enum EProtocols {
    TCP = "TCP",
    UDP = "UDP",
    HTTP = "HTTP",
    HTTPS = "HTTPS",
    ICMP = "ICMP",
    OTHERS = "OTHERS"
}

export const protocolLabels: Record<EProtocols, string> = {
    [EProtocols.TCP]: "TCP",
    [EProtocols.UDP]: "UDP",
    [EProtocols.HTTP]: "HTTP",
    [EProtocols.HTTPS]: "HTTPS",
    [EProtocols.ICMP]: "ICMP",
    [EProtocols.OTHERS]: "Others",
};

export function getProtocolLabel(protocol: EProtocols): string {
    return protocolLabels[protocol] || "Unknown";
}