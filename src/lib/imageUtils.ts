export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = 'Anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image: ' + src));
    img.src = src;
  });
};

export const mergePostcard = async (frontUrl: string, backUrl: string): Promise<string> => {
  const front = await loadImage(frontUrl);
  const back = await loadImage(backUrl);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Vertical merge
  canvas.width = Math.max(front.width, back.width);
  canvas.height = front.height + back.height + 40; // 40px gap
  
  ctx.fillStyle = '#f5f5f4'; // Stone-100 background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.drawImage(front, (canvas.width - front.width) / 2, 0);
  ctx.drawImage(back, (canvas.width - back.width) / 2, front.height + 40);
  
  return canvas.toDataURL('image/jpeg', 0.9);
};
