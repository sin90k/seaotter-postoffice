import * as exifr from 'exifr';

export type ExifParsed = {
  latitude: number | null;
  longitude: number | null;
  date: string | null;
  camera: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

const normalizeLocationField = (raw: unknown): string | undefined => {
  if (typeof raw !== 'string') return undefined;
  const text = raw.trim();
  if (!text) return undefined;
  // EXIF 有时会返回类似 "泰国;泰國" 的多值串，这里只取第一个有效值
  const first = text
    .split(/[;；|/]+/)
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return first || undefined;
};

export async function extractExifFromBlob(input: Blob | File): Promise<ExifParsed | null> {
  try {
    const exif: any = await exifr.parse(input, {
      gps: true,
      tiff: true,
      exif: true,
    } as any);
    if (!exif) return null;

    const rawDate = exif.DateTimeOriginal ?? exif.CreateDate ?? exif.ModifyDate;
    let date: string | null = null;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        date = `${y}.${m}.${day}`;
      }
    }

    const latitude = typeof exif.latitude === 'number' ? exif.latitude : null;
    const longitude = typeof exif.longitude === 'number' ? exif.longitude : null;

    const city = normalizeLocationField(exif.city) ?? normalizeLocationField(exif.City) ?? normalizeLocationField(exif.SubLocation);
    const region =
      normalizeLocationField(exif.state) ??
      normalizeLocationField(exif.State) ??
      normalizeLocationField(exif.Province) ??
      normalizeLocationField(exif.Region);
    const country =
      normalizeLocationField(exif.country) ??
      normalizeLocationField(exif.Country) ??
      normalizeLocationField(exif.CountryCode);

    return {
      latitude,
      longitude,
      date,
      camera: typeof exif.Model === 'string' ? exif.Model : null,
      city: city ?? undefined,
      region: region ?? undefined,
      country: country ?? undefined,
    };
  } catch (e) {
    console.warn('[exifService] parse failed', e);
    return null;
  }
}

