import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideMemberChapterView from "@/components/guides/espace-membre/GuideMemberChapterView";
import { getMemberChapterBySlug, guideMemberChapters } from "@/lib/guides/espace-membre/guideMemberSiteData";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guideMemberChapters.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const chapter = getMemberChapterBySlug(slug);
  if (!chapter) return { title: "Guide espace membre | TENF" };

  return {
    title: `${chapter.title} — guide espace membre | TENF`,
    description: chapter.subtitle,
    alternates: {
      canonical: `https://tenf-community.com/guides/espace-membre/${slug}`,
    },
  };
}

export default async function GuideMemberChapterPage({ params }: Props) {
  const { slug } = await params;
  if (!getMemberChapterBySlug(slug)) notFound();
  return <GuideMemberChapterView slug={slug} />;
}
