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

    const city =
      (typeof exif.city === 'string' ? exif.city : null) ??
      (typeof exif.City === 'string' ? exif.City : null) ??
      (typeof exif.SubLocation === 'string' ? exif.SubLocation : null);
    const region =
      (typeof exif.state === 'string' ? exif.state : null) ??
      (typeof exif.State === 'string' ? exif.State : null) ??
      (typeof exif.Province === 'string' ? exif.Province : null) ??
      (typeof exif.Region === 'string' ? exif.Region : null);
    const country =
      (typeof exif.country === 'string' ? exif.country : null) ??
      (typeof exif.Country === 'string' ? exif.Country : null) ??
      (typeof exif.CountryCode === 'string' ? exif.CountryCode : null);

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

