import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LegacyMembresMePage({ searchParams }: PageProps) {
  const onboardingParam = searchParams?.onboarding;
  const onboarding = Array.isArray(onboardingParam) ? onboardingParam[0] : onboardingParam;
  const target = "/member/profil/completer";
  redirect(target);
}
