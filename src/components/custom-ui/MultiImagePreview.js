'use client';

import Image from 'next/image';

export default function MultiImagePreview({ images, aspectRatio = '1:1' }) {
  // Determine aspect ratio class
  const getAspectRatioClass = (ratio) => {
    const map = {
      '1:1': 'aspect-square',
      '16:9': 'aspect-video',
      '9:16': 'aspect-[9/16]',
      '4:3': 'aspect-[4/3]',
      '3:4': 'aspect-[3/4]',
    };
    return map[ratio] || 'aspect-square';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {images.map((img, index) => (
          <div key={index} className="space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Input {images.length > 1 ? index + 1 : ''}
            </p>
            <div
              className={`relative w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 ${getAspectRatioClass(aspectRatio)}`}
            >
              <Image src={img} alt={`Input ${index + 1}`} fill className="object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
