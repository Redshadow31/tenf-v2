"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function MerciPostulationPage() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="max-w-2xl mx-auto bg-[#1a1a1d] border border-gray-700 rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-3">Merci pour ta candidature</h1>
        <p className="text-gray-300 mb-4">
          Ta postulation a bien été enregistrée. Le staff reviendra vers toi dès qu'une première revue est faite.
        </p>
        {id && <p className="text-xs text-gray-500 mb-6">Référence candidature: {id}</p>}
        <div className="flex gap-3">
          <Link href="/" className="bg-[#9146ff] hover:bg-[#5a32b4] text-white px-4 py-2 rounded-lg font-semibold">
            Retour à l'accueil
          </Link>
          <Link href="/membres/me" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold">
            Mon profil
          </Link>
        </div>
      </div>
    </div>
  );
}
