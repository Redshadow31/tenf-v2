import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideTenfChapterView from "@/components/guides/tenf/GuideTenfChapterView";
import { getTenfChapterBySlug, guideTenfChapters } from "@/lib/guides/tenf/guideTenfSiteData";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guideTenfChapters.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getTenfChapterBySlug(slug);
  if (!chapter) return { title: "Guide TENF | TENF" };

  return {
    title: `${chapter.title} — guide TENF | TENF`,
    description: chapter.subtitle,
    alternates: {
      canonical: `https://tenf-community.com/guides/tenf/${slug}`,
    },
  };
}

export default async function GuideTenfChapterPage({ params }: Props) {
  const { slug } = await params;
  if (!getTenfChapterBySlug(slug)) notFound();
  return <GuideTenfChapterView slug={slug} />;
}
