import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Accès refusé</h1>
        <p className="text-gray-300 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          Cette section est réservée aux administrateurs, admin adjoints, mentors et staff.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

