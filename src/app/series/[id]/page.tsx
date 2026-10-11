"use client";

import dynamic from "next/dynamic";
import { use } from "react";

const SeriesPage = dynamic(
  () => import("@/components/SeriesPage"),
  { ssr: false, loading: () => null }
);

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SeriesPage id={id} />;
}
