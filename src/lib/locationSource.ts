export type LocationSource = 'exif_gps' | 'exif_text' | 'ai_place' | 'manual' | 'unknown';

export type LocationSourceInput = {
  displayLocation?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hasExifGps?: boolean;
  hasExifText?: boolean;
  isManual?: boolean;
};

export type LocationSourceResult = {
  locationSource: LocationSource;
  rawLocationLabel: string | null;
  locationConfidence: number | null;
  mapEligible: boolean;
  rejectedLocationReason: string | null;
};

const GENERIC_PRIVATE_PLACE_RE =
  /^(家中|家里|家裡|在家|家中一角|家里一角|室内|室內|室内一角|室內一角|屋内|屋內|房间|房間|客厅|客廳|卧室|臥室|厨房|廚房|home|athome|indoors?|inside|room|livingroom|bedroom|kitchen)$/i;

export function cleanLocationToken(value?: string | null): string {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[。.!！?？]+$/g, '');
}

export function isGenericPrivatePlace(value?: string | null): boolean {
  const cleaned = cleanLocationToken(value).replace(/\s+/g, '').toLowerCase();
  if (!cleaned) return false;
  return GENERIC_PRIVATE_PLACE_RE.test(cleaned);
}

export function hasValidGps(latitude?: number | null, longitude?: number | null): boolean {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function buildRawLocationLabel(input: LocationSourceInput): string | null {
  const parts = [
    cleanLocationToken(input.city),
    cleanLocationToken(input.region),
    cleanLocationToken(input.country),
  ].filter(Boolean);
  const unique = Array.from(new Set(parts));
  const named = unique.join(', ');
  return cleanLocationToken(input.displayLocation) || named || null;
}

export function resolveLocationSource(input: LocationSourceInput): LocationSourceResult {
  const rawLabel = buildRawLocationLabel(input);
  const generic = isGenericPrivatePlace(rawLabel)
    || isGenericPrivatePlace(input.city)
    || isGenericPrivatePlace(input.region)
    || isGenericPrivatePlace(input.country);
  const gpsOk = hasValidGps(input.latitude, input.longitude);

  let locationSource: LocationSource = 'unknown';
  if (input.hasExifGps && gpsOk) locationSource = 'exif_gps';
  else if (input.hasExifText) locationSource = 'exif_text';
  else if (input.isManual) locationSource = 'manual';
  else if (rawLabel) locationSource = 'ai_place';

  if (generic) {
    return {
      locationSource,
      rawLocationLabel: rawLabel,
      locationConfidence: locationSource === 'exif_gps' ? 0.8 : 0.2,
      mapEligible: false,
      rejectedLocationReason: 'generic_private_place',
    };
  }

  if (!gpsOk) {
    return {
      locationSource,
      rawLocationLabel: rawLabel,
      locationConfidence: locationSource === 'unknown' ? null : 0.6,
      mapEligible: false,
      rejectedLocationReason: 'missing_coordinates',
    };
  }

  return {
    locationSource,
    rawLocationLabel: rawLabel,
    locationConfidence: locationSource === 'exif_gps' ? 1 : 0.75,
    mapEligible: locationSource === 'exif_gps',
    rejectedLocationReason: locationSource === 'exif_gps' ? null : 'coordinates_not_from_exif',
  };
}
