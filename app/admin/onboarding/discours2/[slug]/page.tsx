import IntegrationDiscoursPartPage from "../../../evaluations/discours2/[slug]/page";

type OnboardingPartPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default function OnboardingDiscoursPartPage({ params }: OnboardingPartPageProps) {
  return <IntegrationDiscoursPartPage params={params} />;
}

