import { setRequestLocale } from "next-intl/server";

import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Now } from "@/components/Now";
import { Skills } from "@/components/Skills";
import { Testimonials } from "@/components/Testimonials";
import { Work } from "@/components/Work";
import { getSiteContent } from "@/content/site";
import type { Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const SITE_URL = "https://magnusmagi.com";

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const content = await getSiteContent(locale as Locale);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Magnus Mägi",
    url: SITE_URL,
    image: `${SITE_URL}/icon.svg`,
    jobTitle: content.hero.tagline,
    description: content.hero.intro,
    ...(content.contact.email
      ? { email: `mailto:${content.contact.email}` }
      : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tallinn",
      addressCountry: "EE",
    },
    sameAs: content.contact.social.map((item: { href: string }) => item.href),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <Header />
      <main id="main" className="flex-1">
        <Hero data={content.hero} />
        <About data={content.about} />
        <Now data={content.now} />
        <Skills data={content.skills} />
        <Experience
          eyebrow={content.experienceMeta.eyebrow}
          heading={content.experienceMeta.heading}
          entries={content.experience}
        />
        <Work
          eyebrow={content.workMeta.eyebrow}
          heading={content.workMeta.heading}
          entries={content.work}
        />
        <Testimonials data={content.testimonials} />
        <Contact data={content.contact} />
      </main>
      <Footer data={content.footer} />
    </div>
  );
}
