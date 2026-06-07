"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { evalDTableScrollWrapClass } from "@/lib/admin/evaluation-d/evaluationDStyles";

type Props = {
  children: ReactNode;
  /** Recalcul quand colonnes / lignes changent */
  measureKey?: string;
};

/**
 * Tableau scrollable : ajustement horizontal uniquement si les colonnes dépassent.
 * Scroll vertical pour les nombreuses lignes (évite le scale 2D qui rendait le tableau invisible).
 */
export default function EvaluationDTableFitContainer({ children, measureKey = "" }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    let frame = 0;

    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const table = content.querySelector("table");
        if (!table) return;

        content.style.transform = "scale(1)";

        const naturalWidth = table.scrollWidth || table.getBoundingClientRect().width;
        const availWidth = viewport.clientWidth;
        if (naturalWidth <= 0 || availWidth <= 0) return;

        const nextScale = naturalWidth > availWidth ? Math.max(0.55, availWidth / naturalWidth) : 1;
        content.style.transform = nextScale < 1 ? `scale(${nextScale})` : "none";
        setScale(nextScale);
      });
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(viewport);

    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measureKey]);

  return (
    <div className="w-full min-w-0">
      <div ref={viewportRef} className={`${evalDTableScrollWrapClass} w-full`}>
        <div ref={contentRef} className="inline-block min-w-full origin-top-left">
          {children}
        </div>
      </div>
      {scale < 0.995 ? (
        <p className="mt-2 text-center text-[11px] text-zinc-500" role="status">
          Colonnes réduites à {Math.round(scale * 100)} % pour tenir en largeur — scroll vertical pour parcourir les
          membres.
        </p>
      ) : null}
    </div>
  );
}
