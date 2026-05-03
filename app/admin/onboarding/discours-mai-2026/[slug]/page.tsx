import { notFound } from "next/navigation";
import { discours2Parts } from "../../../evaluations/discours2/contentMai2026";
import { DiscoursMai2026PartClient } from "../DiscoursMai2026PartClient";

type PartPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OnboardingDiscoursMai2026PartPage({ params }: PartPageProps) {
  const { slug } = await params;
  const partIndex = discours2Parts.findIndex((part) => part.slug === slug);
  if (partIndex === -1) notFound();

  const part = discours2Parts[partIndex];
  const previous = partIndex > 0 ? discours2Parts[partIndex - 1] : null;
  const next = partIndex < discours2Parts.length - 1 ? discours2Parts[partIndex + 1] : null;
  const total = discours2Parts.length;

  return (
    <DiscoursMai2026PartClient
      partIndex={partIndex}
      total={total}
      part={part}
      previous={previous ? { slug: previous.slug, emoji: previous.emoji, title: previous.title } : null}
      next={next ? { slug: next.slug, emoji: next.emoji, title: next.title } : null}
    />
  );
}
