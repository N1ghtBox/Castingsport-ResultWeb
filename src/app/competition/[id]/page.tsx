"use client";

import dynamic from "next/dynamic";
import { use } from "react";

const ResultsPage = dynamic(
  () => import("@/components/ResultsPage"),
  { ssr: false, loading: () => null }
);

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ResultsPage id={id} />;
}
