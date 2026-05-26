"use client";

import dynamic from "next/dynamic";

const CompetitionsGallery = dynamic(
  () => import("@/components/CompetitionsGallery"),
  { ssr: false, loading: () => null }
);

export default function Page() {
  return <CompetitionsGallery />;
}
