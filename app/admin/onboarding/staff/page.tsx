import Link from "next/link";
import IntegrationStaffPage from "../../evaluations/inscription-moderateur/page";

export default function OnboardingStaffPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3 text-sm">
        <span className="text-zinc-300">Vue tactile allégée (mêmes données)</span>
        <Link
          href="/admin/onboarding/staff-mobile"
          className="font-semibold text-indigo-200 underline-offset-2 hover:text-white hover:underline"
        >
          Ouvrir la version mobile →
        </Link>
      </div>
      <IntegrationStaffPage />
    </div>
  );
}

