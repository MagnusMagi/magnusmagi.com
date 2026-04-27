import { collection, config, fields, singleton } from "@keystatic/core";

const writingSchema = {
  title: fields.slug({ name: { label: "Title" } }),
  description: fields.text({
    label: "Description",
    multiline: true,
    description: "1–2 sentence summary shown in lists and meta tags.",
  }),
  publishedAt: fields.date({
    label: "Published at",
    defaultValue: { kind: "today" },
  }),
  tags: fields.array(fields.text({ label: "Tag" }), {
    label: "Tags",
    itemLabel: (props) => props.value,
  }),
  draft: fields.checkbox({
    label: "Draft",
    defaultValue: false,
    description: "Drafts are hidden in production.",
  }),
  coverImage: fields.image({
    label: "Cover image",
    description: "Optional. Shown above the post body.",
    directory: "public/writing-images",
    publicPath: "/writing-images/",
  }),
  coverAlt: fields.text({
    label: "Cover alt text",
    description: "Required when a cover image is set.",
  }),
  content: fields.mdx({
    label: "Content",
    options: {
      heading: [2, 3],
      image: false,
    },
  }),
};

const metaSchema = {
  title: fields.text({ label: "Site title", validation: { length: { min: 1 } } }),
  description: fields.text({
    label: "Site description",
    multiline: true,
    validation: { length: { min: 1 } },
  }),
};

const heroSchema = {
  available: fields.text({ label: "Availability badge" }),
  name: fields.text({ label: "Name" }),
  tagline: fields.text({ label: "Tagline", multiline: true }),
  intro: fields.text({ label: "Intro paragraph", multiline: true }),
  primaryCta: fields.text({ label: "Primary CTA label" }),
  secondaryCta: fields.text({ label: "Secondary CTA label" }),
  metaLocationLabel: fields.text({ label: "Location · label" }),
  metaLocationValue: fields.text({ label: "Location · value" }),
  metaLocationCoords: fields.text({ label: "Location · coords" }),
  metaBuildingLabel: fields.text({ label: "Building · label" }),
  metaBuildingValue: fields.text({ label: "Building · value" }),
  metaBuildingMeta: fields.text({ label: "Building · meta" }),
  metaOpenLabel: fields.text({ label: "Open for · label" }),
  metaOpenValue: fields.text({ label: "Open for · value" }),
  metaOpenMeta: fields.text({ label: "Open for · meta" }),
};

const aboutSchema = {
  eyebrow: fields.text({ label: "Eyebrow" }),
  heading: fields.text({ label: "Heading", multiline: true }),
  paragraph1: fields.text({ label: "Paragraph 1", multiline: true }),
  paragraph2: fields.text({ label: "Paragraph 2", multiline: true }),
  paragraph3: fields.text({ label: "Paragraph 3", multiline: true }),
};

const nowItemFields = {
  title: fields.text({ label: "Title" }),
  body: fields.text({ label: "Body", multiline: true }),
  meta: fields.text({ label: "Meta" }),
};

const nowSchema = {
  heading: fields.text({ label: "Heading" }),
  clubfriends: fields.object(nowItemFields, { label: "Item · ClubFriends" }),
  writing: fields.object(nowItemFields, { label: "Item · Writing" }),
  investing: fields.object(nowItemFields, { label: "Item · Advising" }),
};

const skillsGroupFields = {
  title: fields.text({ label: "Title" }),
  items: fields.text({ label: "Items (· separated)", multiline: true }),
};

const skillsSchema = {
  eyebrow: fields.text({ label: "Eyebrow" }),
  heading: fields.text({ label: "Heading" }),
  product: fields.object(skillsGroupFields, { label: "Group · Product & design" }),
  frontend: fields.object(skillsGroupFields, { label: "Group · Frontend" }),
  backend: fields.object(skillsGroupFields, { label: "Group · Backend & infra" }),
  ai: fields.object(skillsGroupFields, { label: "Group · AI tooling" }),
};

const experienceItemSchema = {
  title: fields.slug({ name: { label: "Slug (internal id)" } }),
  order: fields.integer({
    label: "Order",
    description: "Lower numbers show first.",
    defaultValue: 100,
  }),
  role: fields.text({ label: "Role" }),
  org: fields.text({ label: "Organization" }),
  period: fields.text({ label: "Period" }),
  summary: fields.text({ label: "Summary", multiline: true }),
};

const workItemSchema = {
  title: fields.slug({ name: { label: "Slug (internal id)" } }),
  order: fields.integer({
    label: "Order",
    description: "Lower numbers show first.",
    defaultValue: 100,
  }),
  displayTitle: fields.text({ label: "Display title" }),
  type: fields.text({ label: "Type label" }),
  summary: fields.text({ label: "Summary", multiline: true }),
};

const sectionHeaderSchema = {
  eyebrow: fields.text({ label: "Eyebrow" }),
  heading: fields.text({ label: "Heading" }),
};

const testimonialsSchema = {
  eyebrow: fields.text({ label: "Eyebrow" }),
  heading: fields.text({ label: "Heading" }),
  items: fields.array(
    fields.object({
      quote: fields.text({ label: "Quote", multiline: true }),
      author: fields.text({ label: "Author (initials or name)" }),
      role: fields.text({ label: "Role / org" }),
    }),
    {
      label: "Testimonials",
      itemLabel: (props) => props.fields.author.value,
    },
  ),
};

const contactSchema = {
  eyebrow: fields.text({ label: "Eyebrow" }),
  heading: fields.text({ label: "Heading" }),
  body: fields.text({ label: "Body", multiline: true }),
  email: fields.text({
    label: "Public email address",
    description: "Shown next to the CTA. Also used for the mailto: link.",
  }),
  emailCta: fields.text({ label: "Email CTA label" }),
  secondary: fields.text({ label: "Secondary text" }),
  social: fields.array(
    fields.object({
      label: fields.text({ label: "Label" }),
      href: fields.url({ label: "URL" }),
    }),
    {
      label: "Social links",
      itemLabel: (props) => props.fields.label.value,
    },
  ),
};

const footerSchema = {
  tagline: fields.text({ label: "Tagline" }),
  viewSource: fields.text({ label: "View source link label" }),
};

function siteSection<S extends Record<string, unknown>>(
  label: string,
  locale: "en" | "et",
  schema: S,
) {
  return singleton({
    label,
    path: `content/site/${locale}/${labelToSlug(label)}/`,
    format: { data: "yaml" },
    schema: schema as Parameters<typeof singleton>[0]["schema"],
  });
}

function labelToSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default config({
  storage: { kind: "local" },
  ui: {
    brand: { name: "magnus.mägi" },
    navigation: {
      Writing: ["writingEn", "writingEt"],
      "Site · English": [
        "metaEn",
        "heroEn",
        "aboutEn",
        "nowEn",
        "skillsEn",
        "experienceMetaEn",
        "experienceEn",
        "workMetaEn",
        "workEn",
        "testimonialsEn",
        "contactEn",
        "footerEn",
      ],
      "Site · Estonian": [
        "metaEt",
        "heroEt",
        "aboutEt",
        "nowEt",
        "skillsEt",
        "experienceMetaEt",
        "experienceEt",
        "workMetaEt",
        "workEt",
        "testimonialsEt",
        "contactEt",
        "footerEt",
      ],
    },
  },
  collections: {
    writingEn: collection({
      label: "Writing — English",
      slugField: "title",
      path: "content/writing/en/*",
      format: { contentField: "content" },
      entryLayout: "content",
      columns: ["title", "publishedAt", "draft"],
      schema: writingSchema,
    }),
    writingEt: collection({
      label: "Writing — Estonian",
      slugField: "title",
      path: "content/writing/et/*",
      format: { contentField: "content" },
      entryLayout: "content",
      columns: ["title", "publishedAt", "draft"],
      schema: writingSchema,
    }),
    experienceEn: collection({
      label: "Experience — English",
      slugField: "title",
      path: "content/site/en/experience/*",
      format: { data: "yaml" },
      columns: ["title", "order", "role"],
      schema: experienceItemSchema,
    }),
    experienceEt: collection({
      label: "Experience — Estonian",
      slugField: "title",
      path: "content/site/et/experience/*",
      format: { data: "yaml" },
      columns: ["title", "order", "role"],
      schema: experienceItemSchema,
    }),
    workEn: collection({
      label: "Work — English",
      slugField: "title",
      path: "content/site/en/work/*",
      format: { data: "yaml" },
      columns: ["title", "order", "displayTitle"],
      schema: workItemSchema,
    }),
    workEt: collection({
      label: "Work — Estonian",
      slugField: "title",
      path: "content/site/et/work/*",
      format: { data: "yaml" },
      columns: ["title", "order", "displayTitle"],
      schema: workItemSchema,
    }),
  },
  singletons: {
    metaEn: siteSection("Meta", "en", metaSchema),
    metaEt: siteSection("Meta", "et", metaSchema),
    heroEn: siteSection("Hero", "en", heroSchema),
    heroEt: siteSection("Hero", "et", heroSchema),
    aboutEn: siteSection("About", "en", aboutSchema),
    aboutEt: siteSection("About", "et", aboutSchema),
    nowEn: siteSection("Now", "en", nowSchema),
    nowEt: siteSection("Now", "et", nowSchema),
    skillsEn: siteSection("Skills", "en", skillsSchema),
    skillsEt: siteSection("Skills", "et", skillsSchema),
    experienceMetaEn: siteSection("Experience meta", "en", sectionHeaderSchema),
    experienceMetaEt: siteSection("Experience meta", "et", sectionHeaderSchema),
    workMetaEn: siteSection("Work meta", "en", sectionHeaderSchema),
    workMetaEt: siteSection("Work meta", "et", sectionHeaderSchema),
    testimonialsEn: siteSection("Testimonials", "en", testimonialsSchema),
    testimonialsEt: siteSection("Testimonials", "et", testimonialsSchema),
    contactEn: siteSection("Contact", "en", contactSchema),
    contactEt: siteSection("Contact", "et", contactSchema),
    footerEn: siteSection("Footer", "en", footerSchema),
    footerEt: siteSection("Footer", "et", footerSchema),
  },
});
