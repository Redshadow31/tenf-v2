import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideChapterView from "@/components/guides/partie-publique/GuideChapterView";
import { getChapterBySlug, guideChapters } from "@/lib/guides/partie-publique/guidePublicSiteData";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guideChapters.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getChapterBySlug(slug);
  if (!chapter) return { title: "Guide site public | TENF" };

  return {
    title: `${chapter.title} — guide site public | TENF`,
    description: chapter.subtitle,
    alternates: {
      canonical: `https://tenf-community.com/guides/partie-publique/${slug}`,
    },
  };
}

export default async function GuideChapterPage({ params }: Props) {
  const { slug } = await params;
  if (!getChapterBySlug(slug)) notFound();
  return <GuideChapterView slug={slug} />;
}
