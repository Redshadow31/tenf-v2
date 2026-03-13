import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";

type MemberComingSoonPageProps = {
  title: string;
  description: string;
};

export default function MemberComingSoonPage({ title, description }: MemberComingSoonPageProps) {
  return (
    <MemberSurface>
      <MemberPageHeader title={title} description={description} />
      <EmptyFeatureCard title={title} description={description} />
    </MemberSurface>
  );
}
