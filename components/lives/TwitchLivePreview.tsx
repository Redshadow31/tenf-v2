"use client";

import { useEffect, useMemo, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import theme from "@/components/lives/lives-theme.module.css";

type TwitchLivePreviewProps = {
  channel: string;
  title?: string;
};

export default function TwitchLivePreview({ channel, title }: TwitchLivePreviewProps) {
  const [soundOn, setSoundOn] = useState(false);
  const [parentHost, setParentHost] = useState("localhost");

  useEffect(() => {
    setParentHost(window.location.hostname || "localhost");
  }, []);

  useEffect(() => {
    setSoundOn(false);
  }, [channel]);

  const embedSrc = useMemo(() => {
    const login = channel.replace(/^@+/, "").trim().toLowerCase();
    if (!login) return null;
    const params = new URLSearchParams({
      channel: login,
      parent: parentHost,
      autoplay: "true",
      muted: soundOn ? "false" : "true",
    });
    return `https://player.twitch.tv/?${params.toString()}`;
  }, [channel, parentHost, soundOn]);

  const login = channel.replace(/^@+/, "").trim().toLowerCase();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-violet-200/90">
          Aperçu live {title ? `— ${title}` : ""}
        </p>
        <button
          type="button"
          onClick={() => setSoundOn((value) => !value)}
          className={`${theme.btnSecondary} px-2.5 py-1.5 text-xs`}
          aria-pressed={soundOn}
        >
          {soundOn ? (
            <>
              <Volume2 className="h-3.5 w-3.5" aria-hidden />
              Son activé
            </>
          ) : (
            <>
              <VolumeX className="h-3.5 w-3.5" aria-hidden />
              Activer le son
            </>
          )}
        </button>
      </div>
      <div
        className={`relative aspect-video overflow-hidden rounded-xl border ${theme.glassInset} ${theme.glassInsetViolet}`}
      >
        {embedSrc ? (
          <iframe
            key={`${login}-${soundOn ? "sound" : "muted"}`}
            src={embedSrc}
            title={`Live Twitch de ${login}`}
            className="absolute inset-0 h-full w-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">Chaîne indisponible</div>
        )}
      </div>
      <p className="text-[11px] leading-snug text-zinc-500">
        Lecture sans son par défaut — active le son si tu veux écouter avant de lancer le raid sur Twitch.
      </p>
    </div>
  );
}
