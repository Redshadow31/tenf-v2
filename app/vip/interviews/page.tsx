"use client";

import { useState } from "react";
import Link from "next/link";

interface Interview {
  id: string;
  title: string;
  youtubeId: string;
  date: string;
  vipName: string;
}

// TODO: Remplacer par une vraie source de données (base de données, API, etc.)
const mockInterviews: Interview[] = [
  {
    id: "1",
    title: "Interview avec Clara - VIP du mois",
    youtubeId: "dQw4w9WgXcQ", // Exemple d'ID YouTube
    date: "2024-01-15",
    vipName: "Clara",
  },
  {
    id: "2",
    title: "Interview avec NeXou31 - VIP du mois",
    youtubeId: "dQw4w9WgXcQ",
    date: "2024-02-10",
    vipName: "NeXou31",
  },
  // Ajoutez plus d'interviews ici
];

export default function InterviewsPage() {
  const [interviews] = useState<Interview[]>(mockInterviews);

  return (
    <main className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Interviews vidéo</h1>
          <Link
            href="/vip"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Retour aux VIP
          </Link>
        </div>

        {/* Grille des interviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden hover:border-[#9146ff]/50 transition-colors"
            >
              {/* Vidéo YouTube embed */}
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${interview.youtubeId}`}
                  title={interview.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Informations */}
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  {interview.title}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{interview.vipName}</span>
                  <span>{new Date(interview.date).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {interviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Aucune interview disponible pour le moment.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}


