import exifr from 'exifr';

export type ExifParsed = {
  latitude: number | null;
  longitude: number | null;
  date: string | null;
  camera: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

/** 解析图片 EXIF，统一返回标准结构，供前端各处复用。 */
export async function extractExifFromBlob(input: Blob | File): Promise<ExifParsed | null> {
  try {
    const exif: any = await exifr.parse(input, {
      gps: true,
      tiff: true,
      ifd0: true,
      exif: true,
    });
    if (!exif) return null;

    // 日期：格式化为 YYYY.MM.DD
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

    // 经纬度
    const latitude = typeof exif.latitude === 'number' ? exif.latitude : null;
    const longitude = typeof exif.longitude === 'number' ? exif.longitude : null;

    // 城市 / 省份 / 国家
    const city =
      (exif.city as string) ??
      (exif.City as string) ??
      (exif.SubLocation as string) ??
      null;
    const region =
      (exif.state as string) ??
      (exif.State as string) ??
      (exif.Province as string) ??
      (exif.Region as string) ??
      null;
    const country =
      (exif.country as string) ??
      (exif.Country as string) ??
      (exif.CountryCode as string) ??
      null;

    const camera = typeof exif.Model === 'string' ? exif.Model : null;

    return { latitude, longitude, date, camera, city, region, country };
  } catch (e) {
    console.warn('[exifService] parse failed', e);
    return null;
  }
}

import exifr from 'exifr';

export type ExifData = {
  latitude: number | null;
  longitude: number | null;
  dateTime: string | null;
  camera: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

/**
 * Extract EXIF metadata from an image (Blob/File).
 * Used first in the pipeline; when GPS or DateTime exist, they are used directly
 * instead of calling AI vision.
 */
export async function extractExifData(input: Blob | File): Promise<ExifData | null> {
  try {
    const exif = await exifr.parse(input, {
      gps: true,
      tiff: true,
      ifd0: true,
      exif: true,
    });
    if (!exif) return null;

    const dateRaw = exif.DateTimeOriginal ?? exif.CreateDate ?? exif.ModifyDate;
    let dateTime: string | null = null;
    if (dateRaw) {
      const d = new Date(dateRaw);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateTime = `${y}.${m}.${day}`;
      }
    }

    const city =
      typeof exif.city === 'string' ? exif.city : typeof exif.City === 'string' ? exif.City : exif.SubLocation ?? null;
    const region =
      typeof exif.state === 'string'
        ? exif.state
        : typeof exif.State === 'string'
          ? exif.State
          : exif.Province ?? exif.Region ?? null;
    const country =
      typeof exif.country === 'string' ? exif.country : typeof exif.Country === 'string' ? exif.Country : exif.CountryCode ?? null;

    return {
      latitude: typeof exif.latitude === 'number' ? exif.latitude : null,
      longitude: typeof exif.longitude === 'number' ? exif.longitude : null,
      dateTime,
      camera: typeof exif.Model === 'string' ? exif.Model : null,
      city: city ?? undefined,
      region: region ?? undefined,
      country: country ?? undefined,
    };
  } catch {
    return null;
  }
}
