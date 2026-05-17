import StaffQuestionnaireAdminDetailClient from "@/components/admin/moderation/questionnaire/StaffQuestionnaireAdminDetailClient";

export const metadata = {
  title: "Détail questionnaire staff | Modération TENF",
};

type Props = { params: Promise<{ submissionId: string }> };

export default async function StaffQuestionnaireDetailPage({ params }: Props) {
  const { submissionId } = await params;
  return <StaffQuestionnaireAdminDetailClient submissionId={submissionId} />;
}
