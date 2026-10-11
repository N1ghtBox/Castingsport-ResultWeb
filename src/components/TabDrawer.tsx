"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

type Props = {
  groups: { label: string; items: string[] }[];
  activeTab: string;
  onSelect: (tab: string) => void;
};

export default function TabDrawer({ groups, activeTab, onSelect }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mb-6 flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
        {t(activeTab)}
      </button>

      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto scrollbar-thin transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setOpen(false)}
            aria-label={t("Zamknij")}
            className="text-gray-400 hover:text-white text-xl leading-none px-2"
          >
            ×
          </button>
        </div>
        {groups.filter((group) => group.items.length > 0).map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t(group.label)}
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map((tab) => (
                <button
                  key={tab}
                  tabIndex={open ? 0 : -1}
                  onClick={() => {
                    onSelect(tab);
                    setOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-blue-500 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {t(tab)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>
    </>
  );
}
