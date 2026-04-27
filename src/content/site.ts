import "server-only";

import { createReader } from "@keystatic/core/reader";

import keystaticConfig from "../../keystatic.config";
import type { Locale } from "@/i18n/routing";

const reader = createReader(process.cwd(), keystaticConfig);

type LocaleSuffix = Capitalize<Locale>;

function suffix(locale: Locale): LocaleSuffix {
  return (locale.charAt(0).toUpperCase() + locale.slice(1)) as LocaleSuffix;
}

async function readSingleton<K extends keyof typeof reader.singletons>(
  key: K,
): Promise<NonNullable<Awaited<ReturnType<(typeof reader.singletons)[K]["read"]>>>> {
  const singleton = reader.singletons[key];
  const data = await singleton.read();
  if (!data) {
    throw new Error(`Missing singleton content: ${String(key)}`);
  }
  return data as NonNullable<Awaited<ReturnType<(typeof reader.singletons)[K]["read"]>>>;
}

export async function getMeta(locale: Locale) {
  return readSingleton(`meta${suffix(locale)}` as "metaEn" | "metaEt");
}

export async function getHero(locale: Locale) {
  return readSingleton(`hero${suffix(locale)}` as "heroEn" | "heroEt");
}

export async function getAbout(locale: Locale) {
  return readSingleton(`about${suffix(locale)}` as "aboutEn" | "aboutEt");
}

export async function getNow(locale: Locale) {
  return readSingleton(`now${suffix(locale)}` as "nowEn" | "nowEt");
}

export async function getSkills(locale: Locale) {
  return readSingleton(`skills${suffix(locale)}` as "skillsEn" | "skillsEt");
}

export async function getContact(locale: Locale) {
  return readSingleton(`contact${suffix(locale)}` as "contactEn" | "contactEt");
}

export async function getFooter(locale: Locale) {
  return readSingleton(`footer${suffix(locale)}` as "footerEn" | "footerEt");
}

export async function getExperienceMeta(locale: Locale) {
  return readSingleton(
    `experienceMeta${suffix(locale)}` as "experienceMetaEn" | "experienceMetaEt",
  );
}

export async function getWorkMeta(locale: Locale) {
  return readSingleton(`workMeta${suffix(locale)}` as "workMetaEn" | "workMetaEt");
}

export interface ExperienceEntry {
  slug: string;
  order: number;
  role: string;
  org: string;
  period: string;
  summary: string;
}

export async function getExperience(locale: Locale): Promise<ExperienceEntry[]> {
  const collection =
    locale === "en" ? reader.collections.experienceEn : reader.collections.experienceEt;
  const entries = await collection.all();
  return entries
    .map((entry) => ({
      slug: entry.slug,
      order: entry.entry.order ?? 100,
      role: entry.entry.role,
      org: entry.entry.org,
      period: entry.entry.period,
      summary: entry.entry.summary,
    }))
    .sort((a, b) => a.order - b.order);
}

export interface WorkEntry {
  slug: string;
  order: number;
  displayTitle: string;
  type: string;
  summary: string;
}

export async function getWork(locale: Locale): Promise<WorkEntry[]> {
  const collection = locale === "en" ? reader.collections.workEn : reader.collections.workEt;
  const entries = await collection.all();
  return entries
    .map((entry) => ({
      slug: entry.slug,
      order: entry.entry.order ?? 100,
      displayTitle: entry.entry.displayTitle,
      type: entry.entry.type,
      summary: entry.entry.summary,
    }))
    .sort((a, b) => a.order - b.order);
}

export interface SiteContent {
  meta: Awaited<ReturnType<typeof getMeta>>;
  hero: Awaited<ReturnType<typeof getHero>>;
  about: Awaited<ReturnType<typeof getAbout>>;
  now: Awaited<ReturnType<typeof getNow>>;
  skills: Awaited<ReturnType<typeof getSkills>>;
  experienceMeta: Awaited<ReturnType<typeof getExperienceMeta>>;
  experience: ExperienceEntry[];
  workMeta: Awaited<ReturnType<typeof getWorkMeta>>;
  work: WorkEntry[];
  contact: Awaited<ReturnType<typeof getContact>>;
  footer: Awaited<ReturnType<typeof getFooter>>;
}

export async function getSiteContent(locale: Locale): Promise<SiteContent> {
  const [
    meta,
    hero,
    about,
    now,
    skills,
    experienceMeta,
    experience,
    workMeta,
    work,
    contact,
    footer,
  ] = await Promise.all([
    getMeta(locale),
    getHero(locale),
    getAbout(locale),
    getNow(locale),
    getSkills(locale),
    getExperienceMeta(locale),
    getExperience(locale),
    getWorkMeta(locale),
    getWork(locale),
    getContact(locale),
    getFooter(locale),
  ]);
  return {
    meta,
    hero,
    about,
    now,
    skills,
    experienceMeta,
    experience,
    workMeta,
    work,
    contact,
    footer,
  };
}
