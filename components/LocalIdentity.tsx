"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type LocalIdentityValue = { name: string | null; title: string };
const LocalIdentityContext = createContext<LocalIdentityValue>({ name: null, title: "KFC VALM" });

function makeTitle(name: string | null) {
  if (!name) return "KFC VALM";
  const normalized = name.trim().replace(/\s+/g, " ");
  if (/^kfc\s/i.test(normalized)) return normalized.toUpperCase().endsWith("VALM") ? normalized : `${normalized} VALM`;
  return `KFC ${normalized} VALM`;
}

export function LocalIdentityProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/login") return;
    let cancelled = false;
    fetch("/api/local-config", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled) setName(data?.nombre ?? null); })
      .catch(() => { if (!cancelled) setName(null); });
    return () => { cancelled = true; };
  }, [pathname]);

  const value = useMemo(() => {
    const activeName = pathname === "/login" ? null : name;
    return { name: activeName, title: makeTitle(activeName) };
  }, [name, pathname]);
  useEffect(() => { document.title = value.title; }, [value.title]);
  return <LocalIdentityContext.Provider value={value}>{children}</LocalIdentityContext.Provider>;
}

export function useLocalIdentity() { return useContext(LocalIdentityContext); }
