"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import {
  renderConseilsOverride,
  renderDiscoursOverride,
  renderPointsOverride,
  useDiscoursCustomContent,
} from "@/components/admin/discours/customText";

type BlockKind = "points" | "discours" | "conseils";
type BlockMap = Record<string, string>;

interface EditableBlockProps {
  title: string;
  titleClassName: string;
  containerClassName: string;
  kind: BlockKind;
  value?: string | null;
  onSave: (text: string) => Promise<void>;
  children: ReactNode;
}

function parseBlockMap(raw?: string | null): BlockMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.entries(parsed).reduce<BlockMap>((acc, [key, value]) => {
      if (typeof value === "string") acc[key] = value;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function EditableBlock({
  title,
  titleClassName,
  containerClassName,
  kind,
  value,
  onSave,
  children,
}: EditableBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const renderOverride = () => {
    if (!value?.trim()) return null;
    if (kind === "points") return renderPointsOverride(value);
    if (kind === "conseils") return renderConseilsOverride(value);
    return renderDiscoursOverride(value);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(draft);
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message || "Erreur de sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={containerClassName}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className={`text-xl font-bold ${titleClassName}`}>{title}</h3>
        <button
          type="button"
          onClick={() => {
            setDraft(value || "");
            setError(null);
            setIsEditing((prev) => !prev);
          }}
          className="text-xs px-3 py-1.5 rounded-md border border-gray-600 text-gray-200 hover:border-[#9146ff] hover:text-white transition-colors"
        >
          {isEditing ? "Fermer" : "Modifier"}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={kind === "discours" ? 12 : 7}
            placeholder={
              kind === "discours"
                ? "Écris le texte avec des paragraphes (ligne vide = nouveau paragraphe)"
                : "Une ligne = un élément de liste"
            }
            className="w-full rounded-lg border border-gray-700 bg-[#0f0f11] p-3 text-gray-200 focus:outline-none focus:border-[#9146ff]"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(value || "");
                setIsEditing(false);
                setError(null);
              }}
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:border-gray-400 transition-colors"
            >
              Annuler
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Astuce mise en page : une ligne = un point/conseil, ligne vide = nouveau paragraphe.
          </p>
          {error ? <p className="text-xs text-red-300">{error}</p> : null}
        </div>
      ) : (
        renderOverride() || children
      )}
    </div>
  );
}

export default function Partie1Page() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const custom = useDiscoursCustomContent("partie-1");
  const [pointsBlocks, setPointsBlocks] = useState<BlockMap>({});
  const [discoursBlocks, setDiscoursBlocks] = useState<BlockMap>({});
  const [conseilsBlocks, setConseilsBlocks] = useState<BlockMap>({});

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setPointsBlocks(parseBlockMap(custom.points));
  }, [custom.points]);

  useEffect(() => {
    setDiscoursBlocks(parseBlockMap(custom.discours));
  }, [custom.discours]);

  useEffect(() => {
    setConseilsBlocks(parseBlockMap(custom.conseils));
  }, [custom.conseils]);

  const saveBlock = async (kind: BlockKind, section: string, text: string) => {
    const nextPoints = { ...pointsBlocks };
    const nextDiscours = { ...discoursBlocks };
    const nextConseils = { ...conseilsBlocks };

    const clean = text.trim();
    const target = kind === "points" ? nextPoints : kind === "discours" ? nextDiscours : nextConseils;
    if (clean) target[section] = text;
    else delete target[section];

    const response = await fetch("/api/admin/evaluations/discours-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part: "partie-1",
        points: JSON.stringify(nextPoints),
        discours: JSON.stringify(nextDiscours),
        conseils: JSON.stringify(nextConseils),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || "Impossible de sauvegarder ce bloc.");
    }

    setPointsBlocks(nextPoints);
    setDiscoursBlocks(nextDiscours);
    setConseilsBlocks(nextConseils);
  };

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/evaluations/discours"
            className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Retour au guide
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Partie 1 - Bienvenue, Fondations, Staff</h1>
          <p className="text-gray-400">Slides 1, 2, 3</p>
        </div>

        {/* SLIDE 1 : BIENVENUE */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide1">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">1. Bienvenue sur Twitch Entraide New Family</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 3-4 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Créer une atmosphère chaleureuse</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Red_Shadow_31</span>
            </div>
          </div>

          <div className="mt-6">
            <EditableBlock
              title="📌 Points Clés à Aborder"
              titleClassName="text-cyan-400"
              containerClassName="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg"
              kind="points"
              value={pointsBlocks.slide1}
              onSave={(text) => saveBlock("points", "slide1", text)}
            >
                <ul className="list-none pl-0 space-y-2">
                  <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Accueillir chaleureusement tous les participants</li>
                  <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Présenter la New Family comme une communauté humaine et structurée</li>
                  <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Expliquer l&apos;objectif clair de la réunion d&apos;intégration</li>
                  <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Introduire la notion de réciprocité (entraide dans les deux sens)</li>
                  <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Rassurer : chacun avance à son rythme</li>
                  <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Poser le ton : bienveillance + cadre cohérent</li>
                </ul>
            </EditableBlock>

            <EditableBlock
              title="🎤 Discours Suggéré"
              titleClassName="text-amber-400"
              containerClassName="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg"
              kind="discours"
              value={discoursBlocks.slide1}
              onSave={(text) => saveBlock("discours", "slide1", text)}
            >
                <div className="text-gray-300 leading-relaxed space-y-3">
                  <p>&quot;Salut tout le monde, et <strong>bienvenue officiellement</strong> dans la <span style={{ color: '#7b4fd6' }}><strong>Twitch Entraide New Family</strong></span> !</p>
                  <p>Merci d&apos;avoir pris le temps d&apos;être ici aujourd&apos;hui. Le simple fait de rejoindre cette réunion montre déjà une chose essentielle : vous avez envie de <strong>comprendre</strong>, de <strong>vous intégrer</strong> et de faire partie d&apos;un <strong>collectif</strong>.</p>
                  <p>Ici, vous n&apos;avez pas rejoint un Discord parmi tant d&apos;autres. La New Family, c&apos;est une <span style={{ color: '#7b4fd6' }}><strong>famille choisie</strong></span> : une communauté de streamers, de créateurs et de passionnés qui avancent <strong>ensemble</strong>, qui s&apos;entraident réellement et qui construisent quelque chose sur la <strong>durée</strong>.</p>
                  <p>Vous avez tous votre place ici. Mais notre fonctionnement repose sur un principe simple : l&apos;<strong>entraide fonctionne dans les deux sens</strong>.</p>
                  <p>La visibilité ne s&apos;achète pas, elle ne se donne pas au hasard : elle se construit par l&apos;<strong>implication</strong>, le <strong>respect</strong> et la <strong>participation</strong> à la vie collective.</p>
                  <p>Cette réunion n&apos;a pas pour but de vous noyer sous des règles, mais de vous expliquer pourquoi nous avons un <strong>cadre</strong>, comment il protège la communauté, et comment il peut vous aider à évoluer dans votre streaming et <strong>humainement</strong>.</p>
                  <p>Ici, l&apos;entraide n&apos;est pas un mot dans un titre. C&apos;est une <span style={{ color: '#7b4fd6' }}><strong>dynamique quotidienne</strong></span> : dans les lives, sur Discord, dans les vocaux, dans les formations et dans les moments plus légers.</p>
                  <p>Vous avancez à votre rythme. Mais si vous choisissez de vous engager, la communauté s&apos;engagera pour vous.</p>
                  <p>Encore <strong>bienvenue dans la New Family</strong> 💜<br />
                  On va maintenant voir ensemble comment tout cela fonctionne concrètement.&quot;</p>
                </div>
            </EditableBlock>

            <EditableBlock
              title="💡 Conseils pour les Modérateurs"
              titleClassName="text-green-400"
              containerClassName="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg"
              kind="conseils"
              value={conseilsBlocks.slide1}
              onSave={(text) => saveBlock("conseils", "slide1", text)}
            >
                <ul className="list-disc pl-6 space-y-2 text-gray-300">
                  <li><strong>🎵 Ton chaleureux et posé</strong> - Le premier contact donne le cadre</li>
                  <li><strong>👋 Saluez nominativement</strong> les participants si possible</li>
                  <li><strong>⏸️ Laissez un petit temps d&apos;installation</strong> au début</li>
                  <li><strong>🔊 Vérifiez</strong> que tout le monde entend bien et se sent à l&apos;aise</li>
                  <li><strong>🙂 Souriez en parlant</strong> - ça s&apos;entend</li>
                  <li><strong>📏 Soyez clairs et cohérents</strong> dans les explications du cadre</li>
                </ul>
              <p className="mt-5 text-gray-200 leading-relaxed">
                <strong className="text-green-300">Cette dernière ligne est essentielle :</strong> vous ne faites plus seulement <em>accueillir</em>, vous <strong>transmettez une structure</strong>.
              </p>
            </EditableBlock>

            <a href="https://www.genspark.ai/api/files/s/BJN4Yrwq" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 1 HD</a>
          </div>
        </section>

        {/* SLIDE 2 : LES FONDATIONS */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide2">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">2. Les Fondations de la New Family</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 5-6 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Raconter l&apos;histoire et les valeurs</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Red_Shadow_31 ou fondateur</span>
            </div>
          </div>

          <div className="mt-6">
            <EditableBlock
              title="📌 Points Clés à Aborder"
              titleClassName="text-cyan-400"
              containerClassName="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg"
              kind="points"
              value={pointsBlocks.slide2}
              onSave={(text) => saveBlock("points", "slide2", text)}
            >
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">L&apos;histoire : de Twitch Entraide Family à la New Family</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Le point de rupture : refus de faire payer l&apos;entrée/visibilité</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">La relance le 2 septembre 2024</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Les 3 piliers : Objectif, Modération, Valeurs</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">La croissance : de 70 à 400+ membres (160 actifs)</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">La philosophie : un échec = un tremplin</li>
              </ul>
            </EditableBlock>

            <EditableBlock
              title="🎤 Discours Suggéré"
              titleClassName="text-amber-400"
              containerClassName="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg"
              kind="discours"
              value={discoursBlocks.slide2}
              onSave={(text) => saveBlock("discours", "slide2", text)}
            >
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Pour comprendre ce qu&apos;est aujourd&apos;hui la <span style={{color: '#7b4fd6'}}><strong>New Family</strong></span>, il faut revenir un peu en arrière.</p>
                <p>Avant d&apos;être ce que vous découvrez aujourd&apos;hui, le serveur s&apos;appelait <span style={{color: '#7b4fd6'}}><strong>Twitch Entraide Family</strong></span>. À l&apos;origine, c&apos;était une <strong>idée simple</strong>, née entre passionnés : créer un espace où l&apos;on pouvait <strong>s&apos;entraider entre streamers</strong>, sans compétition ni pression.</p>
                <p>Très vite, une équipe s&apos;est formée. Des personnes ont donné de leur temps, de leur énergie, pour poser les premières bases : des salons, des outils, des règles… mais surtout une <span style={{color: '#7b4fd6'}}><strong>ambiance humaine et bienveillante</strong></span>, où chacun pouvait trouver sa place.</p>
                <p>Avec le temps, une divergence importante est apparue. Le point de rupture, ça a été le moment où l&apos;un des créateurs a voulu <span style={{color: '#7b4fd6'}}><strong>faire payer l&apos;entrée et/ou la visibilité</strong></span>.</p>
                <p>Pour nous, c&apos;était une <strong>ligne rouge</strong>. L&apos;entraide ne se monétise pas ici. La visibilité ne s&apos;achète pas. On a donc dit <strong>non</strong> — et les clés du projet nous ont été laissées.</p>
                <p>C&apos;est à ce moment-là qu&apos;est née la <span style={{color: '#7b4fd6'}}><strong>Twitch Entraide New Family</strong></span>.</p>
                <p>Le vrai nouveau départ, c&apos;est le <span style={{color: '#7b4fd6'}}><strong>2 septembre 2024</strong></span>. On a relancé le serveur sur des bases plus claires, plus solides, plus alignées avec nos valeurs : une version plus libre, plus humaine, et plus cohérente.</p>
                <p>Au moment de cette relance, nous étions <span style={{color: '#7b4fd6'}}><strong>42 membres</strong></span>. Aujourd&apos;hui, la communauté compte <span style={{color: '#7b4fd6'}}><strong>environ 480 membres</strong></span>, dont <span style={{color: '#7b4fd6'}}><strong>près de 200 réellement actifs dans le système d&apos;entraide</strong></span>.</p>
                <p>Mais au-delà des chiffres, ce qui fait notre richesse, c&apos;est la diversité : des streamers débutants, des créateurs expérimentés, des viewers engagés.</p>
                <p>La New Family, ce n&apos;est pas une course. Ce n&apos;est pas un classement. C&apos;est une communauté qui avance <strong>ensemble</strong>, qui apprend <strong>ensemble</strong>, et qui croit profondément en <span style={{color: '#7b4fd6'}}><strong>la force de l&apos;humain avant tout</strong></span>.&quot;</p>
              </div>
            </EditableBlock>

            <EditableBlock
              title="💡 Conseils pour les Modérateurs"
              titleClassName="text-green-400"
              containerClassName="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg"
              kind="conseils"
              value={conseilsBlocks.slide2}
              onSave={(text) => saveBlock("conseils", "slide2", text)}
            >
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>📖 Racontez l&apos;histoire</strong> avec émotion - c&apos;est notre ADN</li>
                <li><strong>💪 Insistez sur le refus de monétiser</strong> l&apos;entraide - c&apos;est fondamental</li>
                <li><strong>📊 Donnez les chiffres</strong> (70→400 membres) pour montrer la croissance</li>
                <li><strong>🎯 Mettez en avant</strong> la philosophie : échec = tremplin</li>
                <li><strong>⏰ Précisez la date</strong> du 2 septembre 2024 - c&apos;est notre anniversaire</li>
              </ul>
            </EditableBlock>

            <a href="https://www.genspark.ai/api/files/s/xjEY6Gh3" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 2 HD</a>
          </div>
        </section>

        {/* SLIDE 3 : LE STAFF */}
        <section className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 mb-8 shadow-lg" id="slide3">
          <div className="border-b-2 border-[#9146ff] pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">3. Le Staff</h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">⏱️ Durée :</strong> 4-5 min</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">🎯 Objectif :</strong> Présenter l&apos;équipe humaine</span>
              <span className="bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-300"><strong className="text-[#9146ff]">👤 Intervenant :</strong> Tout fondateur/adjoint</span>
            </div>
          </div>

          <div className="mt-6">
            <EditableBlock
              title="📌 Points Clés à Aborder"
              titleClassName="text-cyan-400"
              containerClassName="bg-cyan-900/20 border-l-4 border-cyan-500 p-5 my-5 rounded-lg"
              kind="points"
              value={pointsBlocks.slide3}
              onSave={(text) => saveBlock("points", "slide3", text)}
            >
              <ul className="list-none pl-0 space-y-2">
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Les 3 fondateurs : ClaraStoneWall, Red_Shadow_31, Nexou31</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Les 4 administrateurs adjoints : Selena_akemi, Nangel89, Jenny31200, Tab&apos;s_up</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">L&apos;équipe de modérateurs : mentors et juniors</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">Le rôle de chacun dans la communauté</li>
                <li className="pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-cyan-400 before:font-bold">L&apos;accessibilité du staff (Discord, vocal, MP)</li>
              </ul>
            </EditableBlock>

            <EditableBlock
              title="🎤 Discours Suggéré"
              titleClassName="text-amber-400"
              containerClassName="bg-amber-900/20 border-l-4 border-amber-500 p-5 my-5 rounded-lg"
              kind="discours"
              value={discoursBlocks.slide3}
              onSave={(text) => saveBlock("discours", "slide3", text)}
            >
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>&quot;Derrière la <span style={{color: '#7b4fd6'}}><strong>New Family</strong></span>, il y a avant tout des <strong>personnes</strong>. Pas des grades, pas des titres impressionnants, mais des <strong>humains</strong> qui donnent de leur temps et de leur énergie pour faire vivre la communauté.</p>
                <p>La New Family repose d&apos;abord sur <span style={{color: '#7b4fd6'}}><strong>trois fondateurs</strong></span> : <strong>Clara</strong>, <strong>Nexou</strong> et <strong>Red</strong>. Ce sont eux qui portent le projet depuis le début, qui en définissent la vision et qui veillent à ce que l&apos;esprit New Family reste intact.</p>
                <p>Vous les croiserez très souvent : sur <strong>Discord</strong>, en <strong>vocal</strong>, en <strong>messages privés</strong>, dans les salons… mais aussi dans les <strong>lives des membres</strong>, les <strong>raids</strong>, les <strong>événements communautaires</strong>. Leur rôle n&apos;est pas seulement de décider, mais surtout <strong>d&apos;écouter</strong>, <strong>d&apos;organiser</strong>, <strong>d&apos;accompagner</strong> et de <strong>coordonner</strong>.</p>
                <p>À leurs côtés, il y a <span style={{color: '#7b4fd6'}}><strong>quatre administrateurs adjoints</strong></span> : <strong>Selena_akemi</strong>, <strong>Nangel89</strong>, <strong>Jenny31200</strong> et <strong>Tab&apos;s_up</strong>. Ils soutiennent les fondateurs, assurent la continuité du projet, coordonnent les équipes et prennent le relais quand c&apos;est nécessaire. Ils jouent un rôle clé dans la <strong>stabilité</strong> et la <strong>solidité</strong> du serveur.</p>
                <p>Et bien sûr, la New Family ne serait rien sans son <span style={{color: '#7b4fd6'}}><strong>équipe de modération</strong></span>. Les <strong>modérateurs mentors</strong> sont les piliers du terrain : formés, expérimentés, présents au quotidien pour accueillir, guider et soutenir les membres. Les <strong>modérateurs juniors</strong>, eux, sont en apprentissage. Ils se forment avec nous, accompagnés par les mentors et les fondateurs, pour devenir à leur tour des acteurs clés de la communauté.</p>
                <p>Ce qu&apos;il est important de retenir, c&apos;est que le <span style={{color: '#7b4fd6'}}><strong>staff est accessible</strong></span>. Vous pouvez nous parler sur Discord, en vocal, en message privé, dans les salons. Il n&apos;y a <strong>pas de barrière volontaire</strong>, pas de distance imposée.</p>
                <p>Ensemble, fondateurs, adjoints et modérateurs forment une <span style={{color: '#7b4fd6'}}><strong>équipe soudée</strong></span>, à l&apos;écoute, disponible, et engagée pour faire avancer cette grande famille qu&apos;est la New Family.&quot;</p>
              </div>
            </EditableBlock>

            <EditableBlock
              title="💡 Conseils pour les Modérateurs"
              titleClassName="text-green-400"
              containerClassName="bg-green-900/20 border-l-4 border-green-500 p-5 my-5 rounded-lg"
              kind="conseils"
              value={conseilsBlocks.slide3}
              onSave={(text) => saveBlock("conseils", "slide3", text)}
            >
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li><strong>👥 Présentez brièvement</strong> chaque membre du staff présent dans le vocal</li>
                <li><strong>💜 Insistez sur l&apos;accessibilité</strong> de l&apos;équipe (MP, salons, vocal)</li>
                <li><strong>🌟 Valorisez le travail</strong> dans l&apos;ombre (organisation, visuels, etc.)</li>
                <li><strong>🤝 Mentionnez la soudure</strong> de l&apos;équipe - on avance ensemble</li>
                <li><strong>📢 Encouragez</strong> les nouveaux à poser des questions au staff</li>
              </ul>
            </EditableBlock>

            <a href="https://www.genspark.ai/api/files/s/Y7i7dZS6" className="inline-block mt-4 px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white rounded-lg transition-all hover:-translate-y-0.5 font-medium" target="_blank" rel="noopener noreferrer">📥 Télécharger Slide 3 HD</a>
          </div>
        </section>

        {/* Back to top button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-[#9146ff] hover:bg-[#7c3aed] text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all hover:-translate-y-1 z-50"
            aria-label="Retour en haut"
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}

