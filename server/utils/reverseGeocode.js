const buildUserAgent = () =>
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    'UniGo-FYP/1.0 (reverse geocoding; set NOMINATIM_USER_AGENT for production)';

const preferredLanguage = () => process.env.NOMINATIM_LANG?.trim() || 'en';

const toNum = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

const formatPlace = (address) => {
    if (!address || typeof address !== 'object') return null;
    const primary =
        address.suburb ||
        address.neighbourhood ||
        address.quarter ||
        address.village ||
        address.town ||
        address.city_district ||
        address.city;
    const secondary =
        address.city && address.city !== primary
            ? address.city
            : address.town && address.town !== primary
                ? address.town
                : address.county && address.county !== primary
                    ? address.county
                    : null;
    const out = [primary, secondary].filter(Boolean).join(', ');
    return out || null;
};

export const reverseGeocodeNominatim = async ({ lat, lng }, { timeoutMs = 4500 } = {}) => {
    const latitude = toNum(lat);
    const longitude = toNum(lng);
    if (latitude === null || longitude === null) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('lat', String(latitude));
        url.searchParams.set('lon', String(longitude));
        url.searchParams.set('zoom', '18');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('accept-language', preferredLanguage());

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                // Nominatim requires a User-Agent identifying the application.
                'User-Agent': buildUserAgent(),
                'Accept-Language': preferredLanguage()
            },
            signal: controller.signal
        });

        if (!res.ok) return null;
        const json = await res.json().catch(() => null);
        const concise = formatPlace(json?.address);
        if (concise) return concise;
        return json?.display_name ? String(json.display_name) : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
};
