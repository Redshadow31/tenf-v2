"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

type Props = {
  source: string;
  className?: string;
};

/** Affichage des avis avec retours à la ligne et markdown proche de Discord (GFM + sauts de ligne simples). */
export default function ReviewMessageMarkdown({ source, className = "" }: Props) {
  return (
    <div className={`prose prose-invert prose-sm max-w-none break-words leading-6 ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{source}</ReactMarkdown>
    </div>
  );
}
