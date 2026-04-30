import "server-only";

import {
  getAbout,
  getContact,
  getExperience,
  getExperienceMeta,
  getHero,
  getMeta,
  getNow,
  getSkills,
  getTestimonials,
  getWork,
  getWorkMeta,
} from "@/content/site";
import { getAllPosts, getPostBySlug } from "@/content/writing";
import { routing, type Locale } from "@/i18n/routing";

const SITE_URL = "https://magnusmagi.com";

function localePrefix(locale: Locale): string {
  return locale === "en" ? "" : `/${locale}`;
}

function siteUrl(locale: Locale, route: string): string {
  return `${SITE_URL}${localePrefix(locale)}${route}`;
}

interface ParsedRoute {
  locale: Locale;
  segments: string[];
}

function parseRoute(rawPath: string): ParsedRoute {
  const cleaned = rawPath.split("?")[0].split("#")[0];
  const trimmed = cleaned.replace(/^\/+/, "").replace(/\/+$/, "");
  const parts = trimmed.length === 0 ? [] : trimmed.split("/");
  let locale: Locale = routing.defaultLocale;
  let rest = parts;
  if (parts[0] && (routing.locales as readonly string[]).includes(parts[0])) {
    locale = parts[0] as Locale;
    rest = parts.slice(1);
  }
  return { locale, segments: rest };
}

function dotJoin(items: Array<string | undefined | null>): string {
  return items.filter(Boolean).join(" · ");
}

function formatDate(iso: string, locale: Locale): string {
  const tag = locale === "et" ? "et-EE" : "en-US";
  return new Date(iso).toLocaleDateString(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function renderHome(locale: Locale): Promise<string> {
  const [meta, hero, about, now, skills, expMeta, experience, workMeta, work, testimonials, contact] =
    await Promise.all([
      getMeta(locale),
      getHero(locale),
      getAbout(locale),
      getNow(locale),
      getSkills(locale),
      getExperienceMeta(locale),
      getExperience(locale),
      getWorkMeta(locale),
      getWork(locale),
      getTestimonials(locale),
      getContact(locale),
    ]);

  const lines: string[] = [];
  lines.push(`# ${hero.name}`);
  lines.push("");
  lines.push(`> ${hero.tagline}`);
  lines.push("");
  lines.push(hero.intro);
  lines.push("");
  lines.push(
    dotJoin([
      `${hero.metaLocationLabel}: ${hero.metaLocationValue}`,
      `${hero.metaBuildingLabel}: ${hero.metaBuildingValue} (${hero.metaBuildingMeta})`,
      `${hero.metaOpenLabel}: ${hero.metaOpenValue}`,
    ]),
  );
  lines.push("");

  lines.push(`## ${about.eyebrow} — ${about.heading}`);
  lines.push("");
  lines.push(about.paragraph1);
  lines.push("");
  lines.push(about.paragraph2);
  lines.push("");
  lines.push(about.paragraph3);
  lines.push("");

  lines.push(`## ${now.heading}`);
  lines.push("");
  for (const item of [now.clubfriends, now.writing, now.investing]) {
    lines.push(`### ${item.title}`);
    lines.push("");
    lines.push(item.body);
    if (item.meta) {
      lines.push("");
      lines.push(`_${item.meta}_`);
    }
    lines.push("");
  }

  lines.push(`## ${skills.eyebrow} — ${skills.heading}`);
  lines.push("");
  for (const group of [skills.product, skills.frontend, skills.backend, skills.ai]) {
    lines.push(`### ${group.title}`);
    lines.push("");
    const items = String(group.items)
      .split("·")
      .map((s: string) => s.trim())
      .filter(Boolean);
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  lines.push(`## ${expMeta.eyebrow} — ${expMeta.heading}`);
  lines.push("");
  for (const entry of experience) {
    lines.push(`### ${entry.role} — ${entry.org}`);
    lines.push("");
    lines.push(`_${entry.period}_`);
    lines.push("");
    lines.push(entry.summary);
    lines.push("");
  }

  lines.push(`## ${workMeta.eyebrow} — ${workMeta.heading}`);
  lines.push("");
  for (const entry of work) {
    lines.push(`### ${entry.displayTitle} (${entry.type})`);
    lines.push("");
    lines.push(entry.summary);
    lines.push("");
  }

  lines.push(`## ${testimonials.eyebrow} — ${testimonials.heading}`);
  lines.push("");
  for (const item of testimonials.items) {
    lines.push(`> ${item.quote}`);
    lines.push(">");
    lines.push(`> — ${item.author}, ${item.role}`);
    lines.push("");
  }

  lines.push(`## ${contact.eyebrow} — ${contact.heading}`);
  lines.push("");
  lines.push(contact.body);
  lines.push("");
  lines.push(`Email: <${contact.email}>`);
  if (contact.social && contact.social.length > 0) {
    lines.push("");
    for (const link of contact.social) {
      if (link.label && link.href) {
        lines.push(`- [${link.label}](${link.href})`);
      }
    }
  }
  lines.push("");
  lines.push("---");
  lines.push(`Site: ${meta.title} — ${meta.description}`);
  lines.push(`Canonical: ${siteUrl(locale, "/")}`);

  return lines.join("\n");
}

async function renderWritingIndex(locale: Locale): Promise<string> {
  const posts = await getAllPosts(locale);
  const lines: string[] = [];
  lines.push(`# ${locale === "et" ? "Kirjutised" : "Writing"}`);
  lines.push("");
  for (const post of posts) {
    const url = siteUrl(locale, `/writing/${post.slug}`);
    lines.push(`## [${post.frontmatter.title}](${url})`);
    lines.push("");
    lines.push(`_${formatDate(post.frontmatter.publishedAt, locale)}_`);
    lines.push("");
    lines.push(post.frontmatter.description);
    if (post.frontmatter.tags.length > 0) {
      lines.push("");
      lines.push(`Tags: ${post.frontmatter.tags.map((t) => `\`${t}\``).join(", ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function renderWritingPost(locale: Locale, slug: string): Promise<string | null> {
  const post = await getPostBySlug(locale, slug);
  if (!post) return null;

  const lines: string[] = [];
  lines.push(`# ${post.frontmatter.title}`);
  lines.push("");
  lines.push(
    dotJoin([
      formatDate(post.frontmatter.publishedAt, locale),
      `${post.readingMinutes} min`,
      siteUrl(locale, `/writing/${post.slug}`),
    ]),
  );
  lines.push("");
  lines.push(`> ${post.frontmatter.description}`);
  lines.push("");
  lines.push(post.content.trim());
  if (post.frontmatter.tags.length > 0) {
    lines.push("");
    lines.push("---");
    lines.push(`Tags: ${post.frontmatter.tags.map((t) => `\`${t}\``).join(", ")}`);
  }
  return lines.join("\n");
}

async function renderTagPage(locale: Locale, tag: string): Promise<string | null> {
  const posts = await getAllPosts(locale);
  const matching = posts.filter((p) =>
    p.frontmatter.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );
  if (matching.length === 0) return null;

  const lines: string[] = [];
  lines.push(`# Tag: \`${tag}\``);
  lines.push("");
  for (const post of matching) {
    const url = siteUrl(locale, `/writing/${post.slug}`);
    lines.push(`## [${post.frontmatter.title}](${url})`);
    lines.push("");
    lines.push(`_${formatDate(post.frontmatter.publishedAt, locale)}_`);
    lines.push("");
    lines.push(post.frontmatter.description);
    lines.push("");
  }
  return lines.join("\n");
}

export async function renderRouteMarkdown(rawPath: string): Promise<string | null> {
  const { locale, segments } = parseRoute(rawPath);

  if (segments.length === 0) {
    return renderHome(locale);
  }

  if (segments[0] === "writing") {
    if (segments.length === 1) return renderWritingIndex(locale);
    if (segments.length === 2) return renderWritingPost(locale, segments[1]);
    if (segments.length === 3 && segments[1] === "tag") {
      return renderTagPage(locale, decodeURIComponent(segments[2]));
    }
  }

  return null;
}
