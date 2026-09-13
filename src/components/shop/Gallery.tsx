'use client';

import { useState } from 'react';
import Image from 'next/image';

type Img = { url: string; alt: string | null };

export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [{ url: '/api/img/ribeye/beef/1', alt: name }];

  return (
    <div className="flex flex-col gap-2.5 lg:sticky lg:top-[86px]">
      <div className="relative aspect-[1/0.84] overflow-hidden rounded-xl3 bg-paper2">
        <Image src={list[active].url} alt={list[active].alt ?? name} fill unoptimized priority
          sizes="(max-width: 1024px) 100vw, 600px" className="object-cover" />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {list.map((img, i) => (
            <button key={img.url} type="button" onClick={() => setActive(i)} aria-current={i === active}
              aria-label={`Фото ${i + 1}`}
              className={`relative h-[62px] w-[74px] shrink-0 overflow-hidden rounded-[9px] border-2 ${
                i === active ? 'border-bordeaux' : 'border-transparent'
              }`}>
              <Image src={img.url} alt="" fill unoptimized sizes="74px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
