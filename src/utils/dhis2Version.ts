import { D2Api } from "$/types/d2-api";

/** Major version of the DHIS2 server (e.g. 40, 41, 42). */
export type Dhis2MajorVersion = number;

/**
 * Reads the DHIS2 server version from `/api/system/info` and returns the major
 * version number.
 *
 * DHIS2 used `"2.X.Y"` format up to 2.41; from 42 onwards the `2.` prefix was
 * dropped and versions follow `"42.X.Y"`.
 *
 * Examples:
 *   "2.40.3"  → 40
 *   "2.41.0"  → 41
 *   "42.0.0"  → 42
 */
export async function getDhis2MajorVersion(api: D2Api): Promise<Dhis2MajorVersion> {
    const info = await api.get<{ version: string }>("/system/info").getData();
    return parseDhis2MajorVersion(info.version);
}

export function parseDhis2MajorVersion(version: string): Dhis2MajorVersion {
    // "2.41.3" → major = 41; "42.0.0" → major = 42
    const parts = version.split(".");
    if (parts[0] === "2" && parts[1] !== undefined) {
        return parseInt(parts[1], 10);
    }
    return parseInt(parts[0] ?? "0", 10);
}
