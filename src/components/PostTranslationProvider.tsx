"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Locale } from "@/i18n/routing";

export interface PostTranslationMap {
  basePath: string;
  slugs: Partial<Record<Locale, string>>;
}

const PostTranslationContext = createContext<PostTranslationMap | null>(null);

interface ProviderProps {
  value: PostTranslationMap;
  children: ReactNode;
}

export function PostTranslationProvider({ value, children }: ProviderProps) {
  return (
    <PostTranslationContext.Provider value={value}>{children}</PostTranslationContext.Provider>
  );
}

export function usePostTranslation(): PostTranslationMap | null {
  return useContext(PostTranslationContext);
}
