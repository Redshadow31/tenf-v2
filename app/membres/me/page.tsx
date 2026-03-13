import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LegacyMembresMePage({ searchParams }: PageProps) {
  const onboardingParam = searchParams?.onboarding;
  const onboarding = Array.isArray(onboardingParam) ? onboardingParam[0] : onboardingParam;
  const target = onboarding === "1" ? "/member/profil?onboarding=1" : "/member/profil";
  redirect(target);
}
