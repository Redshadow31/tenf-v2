"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
  className?: string;
};

/**
 * Rendu proche usage Discord : gras, italique, listes, liens, sauts de ligne.
 * Pas de HTML brut (react-markdown sécurisé par défaut).
 */
export default function AnnouncementMarkdown({ content, className = "" }: Props) {
  return (
    <div className={`prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{content}</ReactMarkdown>
    </div>
  );
}
