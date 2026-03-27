const API_URL = process.env.MOCK_API_URL || "http://localhost:3000/api/v1/attacks";


// ============= INFRASTRUCTURE MOCKS =============
const GEO_IP_ZONES = [
    // Vietnam
    { "lat": 21.028511, "lng": 105.804817, "prefix": "1.53" },      // Ha Noi
    { "lat": 10.823099, "lng": 106.629662, "prefix": "27.68" },     // HCM
    { "lat": 16.047079, "lng": 108.206230, "prefix": "27.72" },     // Da Nang
    // Asia
    { "lat": 39.904202, "lng": 116.407394, "prefix": "210.5" },     // Beijing, CN
    { "lat": 31.230390, "lng": 121.473701, "prefix": "202.96" },    // Shanghai, CN
    { "lat": 35.689487, "lng": 139.691711, "prefix": "203.216" },   // Tokyo, JP
    { "lat": 37.566536, "lng": 126.977966, "prefix": "211.231" },   // Seoul, KR
    { "lat": 1.352083, "lng": 103.819839, "prefix": "202.166" },    // Singapore
    { "lat": 19.075983, "lng": 72.877655, "prefix": "49.204" },     // Mumbai, IN
    // Europe
    { "lat": 51.507351, "lng": -0.127758, "prefix": "5.172" },      // London, UK
    { "lat": 48.856613, "lng": 2.352222, "prefix": "195.154" },     // Paris, FR
    { "lat": 55.755825, "lng": 37.617298, "prefix": "82.146" },     // Moscow, RU
    { "lat": 50.110924, "lng": 8.682127, "prefix": "81.29" },       // Frankfurt, DE
    // Americas
    { "lat": 40.712776, "lng": -74.005974, "prefix": "104.244" },   // New York, US
    { "lat": 37.774929, "lng": -122.419418, "prefix": "8.14" },     // San Francisco, US
    { "lat": 38.895111, "lng": -77.036369, "prefix": "38.33" },     // Washington DC, US
    { "lat": -23.550520, "lng": -46.633308, "prefix": "187.16" },   // Sao Paulo, BR
    // Oceania & Africa
    { "lat": -33.868820, "lng": 151.209290, "prefix": "101.189" },  // Sydney, AU
    { "lat": -33.924870, "lng": 18.424055, "prefix": "196.3" }      // Cape Town, ZA
];

// ============= TARGET SERVERS =============
const TARGET_SERVERS = [
    {
        "ip": "10.0.0.5",
        "role": "Web Frontend",
        "vulns": ["Port Scan", "SYN Flood", "XSS", "DDoS", "Path Traversal"]
    },
    {
        "ip": "10.0.0.10",
        "role": "Database Node",
        "vulns": ["Port Scan", "Brute Force", "SQL Injection", "RCE"]
    },
    {
        "ip": "10.0.0.50",
        "role": "Auth Server",
        "vulns": ["Port Scan", "Brute Force", "Credential Stuffing", "DDoS"]
    }
];

// ============= KILL CHAIN STAGES =============
const KILL_CHAIN_STAGES = {
    "0": { "name": "Reconnaissance", "severities": ["Low", "Medium"] },
    "1": { "name": "Weaponization", "severities": ["Medium", "High"] },
    "2": { "name": "Exploitation", "severities": ["High", "Critical"] }
};

// ============= ATTACK TYPES BY STAGE =============
const ATTACK_TYPES_BY_STAGE = {
    "0": ["Port Scan", "SYN Flood"],
    "1": ["Brute Force", "Credential Stuffing", "XSS", "DDoS"],
    "2": ["SQL Injection", "Path Traversal", "RCE", "Malware C2 Beacon"]
};


function generateRandomIPFromLocation(ipPrefix) {
    const [a, b] = ipPrefix.split(".").map(Number);
    const c = getRandomInt(0, 255);
    const d = getRandomInt(1, 254);
    return `${a}.${b}.${c}.${d}`;
}

// ================= CONFIG =================

const NORMAL_INTERVAL = Number(process.env.MOCK_NORMAL_INTERVAL_MS || 1500);
const SPIKE_INTERVAL = Number(process.env.MOCK_SPIKE_INTERVAL_MS || 100);
const SPIKE_CHANCE = Number(process.env.MOCK_SPIKE_CHANCE || 0.1);
const SPIKE_BURST_SIZE = Number(process.env.MOCK_SPIKE_BURST_SIZE || 5);
const REQUEST_TIMEOUT_MS = Number(process.env.MOCK_REQUEST_TIMEOUT_MS || 4000);
const MAX_ATTACKERS = 15; // Number of concurrent active attackers

let requestCounter = 0;
let isRunning = true;

// ================= UTIL =================
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(level, message, meta = null) {
    const ts = new Date().toISOString();
    const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
    const line = `[${ts}] [${level}] ${message}${suffix}`;

    if (level === "ERROR") {
        console.error(line);
        return;
    }

    if (level === "WARN") {
        console.warn(line);
        return;
    }

    console.log(line);
}


// ================= STATEFUL ATTACKER ENGINE =================
class StatefulAttacker {
    constructor() {
        // Generate IP and coordinates tied together
        const zone = getRandomItem(GEO_IP_ZONES);
        this.source_ip = generateRandomIPFromLocation(zone.prefix);
        this.location = { "lat": zone.lat, "lng": zone.lng };

        // Lock the target
        this.target = getRandomItem(TARGET_SERVERS);

        // Initialize state
        this.stage = 0;
        this.attacksMade = 0;
        this.isActive = true;
    }

    nextMove() {
        this.attacksMade++;

        // Escalation logic
        if (this.attacksMade > 5 && this.stage === 0) this.stage = 1; // Upgrade to Brute-force/XSS
        if (this.attacksMade > 15 && this.stage === 1) this.stage = 2; // Upgrade to Exploit/RCE
        if (this.attacksMade > 20) this.isActive = false; // Escape after job is done

        // Filter attack types compatible with current stage AND target vulnerabilities
        const validAttacks = ATTACK_TYPES_BY_STAGE[this.stage].filter(
            (type) => this.target.vulns.includes(type) || type === "Malware C2 Beacon"
        );

        // Fallback if target has no vulnerabilities at this stage
        const attackType = validAttacks.length > 0 ? getRandomItem(validAttacks) : "Port Scan";
        const severity = getRandomItem(KILL_CHAIN_STAGES[this.stage].severities);

        return {
            source_ip: this.source_ip,
            dest_ip: this.target.ip,
            attack_type: attackType,
            severity: severity,
            location: this.location,
            timestamp: new Date().toISOString()
        };
    }
}

// Manage Attacker Pool
let activeAttackers = [];

function getNextPayload() {
    // Remove "escaped" attackers
    activeAttackers = activeAttackers.filter((attacker) => attacker.isActive);

    // Replenish pool if needed
    while (activeAttackers.length < MAX_ATTACKERS) {
        activeAttackers.push(new StatefulAttacker());
    }

    // Randomly select one attacker from pool to strike
    const attacker = getRandomItem(activeAttackers);
    return attacker.nextMove();
}

// ================= IP =================
function isReservedIp(a, b, c) {
    return (
        a === 0 || // 0.0.0.0/8 (Current network)
        a === 10 || // 10.0.0.0/8 (Private)
        a === 127 || // 127.0.0.0/8 (Loopback)
        a >= 224 || // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
        (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 (CGNAT)
        (a === 169 && b === 254) || // 169.254.0.0/16 (Link-local)
        (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 (Private)
        (a === 192 && b === 168) || // 192.168.0.0/16 (Private)
        // --- Updated to align with Cybersecurity Standards ---
        (a === 192 && b === 0 && c === 0) || // 192.0.0.0/24 (IETF Protocol)
        (a === 192 && b === 0 && c === 2) || // 192.0.2.0/24 (TEST-NET-1)
        (a === 192 && b === 88 && c === 99) || // 192.88.99.0/24 (6to4 Relay)
        (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 (Benchmark Testing)
        (a === 198 && b === 51 && c === 100) || // 198.51.100.0/24 (TEST-NET-2)
        (a === 203 && b === 0 && c === 113) // 203.0.113.0/24 (TEST-NET-3)
    );
}

// ================= SEND =================
async function sendMockData() {
    const requestId = ++requestCounter;
    const payload = getNextPayload();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        if (res.ok) {
            log("INFO", "Mock attack sent", {
                requestId,
                attackType: payload.attack_type,
                severity: payload.severity,
                sourceIp: payload.source_ip,
                destIp: payload.dest_ip,
                status: res.status
            });
            return;
        }

        let responseText = "";
        try {
            responseText = await res.text();
        } catch (readError) {
            responseText = "<failed to read response body>";
        }

        log("WARN", "Server returned non-success status", {
            requestId,
            status: res.status,
            statusText: res.statusText,
            response: responseText
        });
    } catch (err) {
        log("ERROR", "Failed to send mock attack", {
            requestId,
            name: err.name,
            message: err.message,
            isTimeout: err.name === "AbortError"
        });
    } finally {
        clearTimeout(timeout);
    }
}

// ================= LOOP =================
async function startMocking() {
    if (typeof fetch !== "function") {
        throw new Error("Global fetch is not available. Use Node.js 18+ or add a fetch polyfill.");
    }

    log("INFO", "Mock generator started", {
        apiUrl: API_URL,
        normalInterval: NORMAL_INTERVAL,
        spikeInterval: SPIKE_INTERVAL,
        spikeChance: SPIKE_CHANCE,
        spikeBurstSize: SPIKE_BURST_SIZE,
        timeoutMs: REQUEST_TIMEOUT_MS
    });

    while (isRunning) {
        const isSpike = Math.random() < SPIKE_CHANCE;
        const interval = isSpike ? SPIKE_INTERVAL : NORMAL_INTERVAL;

        if (isSpike) {
            log("WARN", "Spike mode triggered", { burstSize: SPIKE_BURST_SIZE });
            await Promise.allSettled(
                Array.from({ length: SPIKE_BURST_SIZE }, () => sendMockData())
            );
        } else {
            await sendMockData();
        }

        if (isRunning) {
            await sleep(interval);
        }
    }

    log("INFO", "Mock generator stopped");
}

function stopMocking(signal) {
    if (!isRunning) {
        return;
    }

    isRunning = false;
    log("WARN", "Shutdown signal received", { signal });
}

process.on("SIGINT", () => stopMocking("SIGINT"));
process.on("SIGTERM", () => stopMocking("SIGTERM"));

startMocking().catch((err) => {
    log("ERROR", "Mock generator crashed", {
        name: err.name,
        message: err.message
    });
    process.exit(1);
});
