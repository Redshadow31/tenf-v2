"use client";



import { useCallback, useEffect, useState } from "react";

import { hexToRgba } from "@/components/member/profil/memberProfileModel";

import { MEMBER_PANEL_RADIUS } from "@/components/member/dashboard/dashboardUi";



export type ProfileNavItem = {

  id: string;

  label: string;

};



type ProfileSubNavProps = {

  items: ReadonlyArray<ProfileNavItem>;

  accentHex?: string;

};



export default function ProfileSubNav({ items, accentHex = "#9146ff" }: ProfileSubNavProps) {

  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");



  const scrollToSection = useCallback((id: string) => {

    const el = document.getElementById(id);

    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });

    setActiveId(id);

  }, []);



  useEffect(() => {

    if (typeof window === "undefined") return;

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(

      (entries) => {

        const visible = entries

          .filter((e) => e.isIntersecting)

          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target?.id) {

          setActiveId(visible[0].target.id);

        }

      },

      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] },

    );

    items.forEach((item) => {

      const el = document.getElementById(item.id);

      if (el) observer.observe(el);

    });

    return () => observer.disconnect();

  }, [items]);



  return (

    <nav

      aria-label="Sections du profil"

      className={`sticky top-[clamp(0.4rem,0.8vw,0.85rem)] z-20 overflow-hidden ${MEMBER_PANEL_RADIUS} border border-white/[0.1] bg-black/45 px-1.5 py-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.32)] backdrop-blur-md`}

    >

      <div className="flex flex-nowrap items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {items.map(({ id, label }) => {

          const active = id === activeId;

          return (

            <button

              key={id}

              type="button"

              onClick={() => scrollToSection(id)}

              aria-current={active ? "true" : undefined}

              className={`inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-xl px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 ${

                active

                  ? "text-white shadow-[0_4px_18px_rgba(0,0,0,0.28)]"

                  : "border border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.04] hover:text-white/88"

              }`}

              style={

                active

                  ? {

                      background: `linear-gradient(155deg, ${hexToRgba(accentHex, 0.3)}, ${hexToRgba(accentHex, 0.1)})`,

                      border: `1px solid ${hexToRgba(accentHex, 0.38)}`,

                      boxShadow: `inset 0 1px 0 ${hexToRgba(accentHex, 0.12)}`,

                    }

                  : undefined

              }

            >

              {label}

            </button>

          );

        })}

      </div>

    </nav>

  );

}


