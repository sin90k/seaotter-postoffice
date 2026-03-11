/**
 * Renders the user's image with a filter applied in real time (local canvas, no API).
 * Used for hover/click preview in the filter selection UI.
 */

import { useEffect, useRef } from 'react';
import { applyFilterById } from '../lib/filter-engine';

interface FilterPreviewCanvasProps {
  imageUrl: string;
  filterId: string;
  intensity: number;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export default function FilterPreviewCanvas({
  imageUrl,
  filterId,
  intensity,
  className = '',
  maxWidth = 400,
  maxHeight = 300,
}: FilterPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    imgRef.current = img;

    const draw = () => {
      if (!img.naturalWidth || !canvas.parentElement) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      let drawW = w;
      let drawH = h;
      if (drawW > maxWidth || drawH > maxHeight) {
        const r = Math.min(maxWidth / drawW, maxHeight / drawH);
        drawW = Math.round(drawW * r);
        drawH = Math.round(drawH * r);
      }
      canvas.width = drawW;
      canvas.height = drawH;
      ctx.drawImage(img, 0, 0, drawW, drawH);
      applyFilterById(filterId, ctx, drawW, drawH, intensity, 0, 0);
    };

    img.onload = draw;
    img.src = imageUrl;

    return () => {
      img.src = '';
      imgRef.current = null;
    };
  }, [imageUrl, filterId, intensity, maxWidth, maxHeight]);

  if (!imageUrl) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
    />
  );
}
