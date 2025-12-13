"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EvaluationMonthPage() {
  const params = useParams();
  const router = useRouter();
  const monthKey = params.month as string;
  
  const [currentMonth, setCurrentMonth] = useState<string>(monthKey || getCurrentMonthKey());

  // Valider le format du mois
  useEffect(() => {
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      router.replace(`/admin/evaluations/${getCurrentMonthKey()}`);
    } else {
      setCurrentMonth(monthKey);
    }
  }, [monthKey, router]);

  function getCurrentMonthKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  function getPreviousMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  }

  function getNextMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear += 1;
    }
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  }

  const sections = [
    {
      id: 'a',
      title: 'A. Présence Active',
      description: 'Spotlights, Raids, Présences',
      href: `/admin/evaluations/${currentMonth}/a`,
      color: 'purple',
    },
    {
      id: 'b',
      title: 'B. Engagement Communautaire',
      description: 'Statbot, Events TENF',
      href: `/admin/evaluations/${currentMonth}/b`,
      color: 'blue',
    },
    {
      id: 'c',
      title: 'C. Follow',
      description: 'Validation des follows entre membres',
      href: `/admin/evaluations/${currentMonth}/c`,
      color: 'green',
    },
    {
      id: 'd',
      title: 'D. Synthèse & Bonus',
      description: 'Résumé et bonus manuels',
      href: `/admin/evaluations/${currentMonth}/d`,
      color: 'yellow',
    },
    {
      id: 'result',
      title: 'Résultat Final',
      description: 'Score indicatif (Staff Only)',
      href: `/admin/evaluations/${currentMonth}/result`,
      color: 'red',
    },
  ];

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Évaluations Mensuelles - {formatMonthLabel(currentMonth)}
        </h1>
      </div>

      {/* Navigation mensuelle */}
      <div className="mb-8 flex items-center justify-between bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
        <Link
          href={`/admin/evaluations/${getPreviousMonth(currentMonth)}`}
          className="px-4 py-2 bg-[#252529] hover:bg-[#2a2a2d] rounded-lg transition-colors"
        >
          ← Mois précédent
        </Link>
        
        <div className="flex items-center gap-4">
          <select
            value={currentMonth}
            onChange={(e) => router.push(`/admin/evaluations/${e.target.value}`)}
            className="bg-[#252529] border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            {generateMonthOptions()}
          </select>
        </div>

        <Link
          href={`/admin/evaluations/${getNextMonth(currentMonth)}`}
          className="px-4 py-2 bg-[#252529] hover:bg-[#2a2a2d] rounded-lg transition-colors"
        >
          Mois suivant →
        </Link>
      </div>

      {/* Grille des sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="block bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{section.title}</h3>
                <p className="text-sm text-gray-400">{section.description}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-${section.color}-600/20 flex items-center justify-center text-2xl font-bold text-${section.color}-400`}>
                {section.id.toUpperCase()}
              </div>
            </div>
            <div className="text-sm text-purple-400 hover:text-purple-300">
              Accéder →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  function generateMonthOptions(): JSX.Element[] {
    const options: JSX.Element[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Générer les 12 derniers mois + mois en cours
    for (let i = 0; i <= 12; i++) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      const label = `${monthNames[date.getMonth()]} ${year}`;
      options.push(
        <option key={monthKey} value={monthKey}>
          {label}
        </option>
      );
    }
    return options;
  }
}

