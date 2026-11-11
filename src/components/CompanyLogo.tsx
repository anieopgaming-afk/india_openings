"use client";
import { useState } from "react";

export default function CompanyLogo({ name, src }: { name: string; src?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div aria-hidden className="display flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mist text-lg font-bold text-forest">
        {name.charAt(0)}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={`${name} logo`} width={48} height={48} loading="lazy" onError={() => setFailed(true)}
    className="h-12 w-12 shrink-0 rounded-lg border border-line bg-white object-contain p-1" />;
}
