"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type DiscordMarkdownPreviewProps = {
  content: string;
  emptyFallback?: string;
};

export default function DiscordMarkdownPreview({
  content,
  emptyFallback = "Aucune description pour le moment.",
}: DiscordMarkdownPreviewProps) {
  const value = (content || "").trim();
  if (!value) {
    return <p style={{ color: "var(--color-text-secondary)" }}>{emptyFallback}</p>;
  }

  return (
    <div
      className="prose prose-invert max-w-none text-sm"
      style={{ color: "var(--color-text)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
    </div>
  );
}
