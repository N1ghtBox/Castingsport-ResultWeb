"use client";

// ISO 3166-1 alpha-2 code ("PL") with its flag from public/flags; "—" when there's none
export default function Nation({ code }: { code?: string }) {
  if (!code) return <>—</>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static svg */}
      <img
        src={`/flags/${code.toLowerCase()}.svg`}
        alt=""
        loading="lazy"
        className="h-3.5 w-5 object-contain"
        onError={(e) => (e.currentTarget.style.display = "none")} // code the set has no flag for
      />
      {code}
    </span>
  );
}
