import ModerationGroupPage from "@/components/admin/moderation/ModerationGroupPage";

export default function AdminModerationStaffGroupRoute({
  params,
}: {
  params: { group: string };
}) {
  return <ModerationGroupPage view="staff" groupSlug={params.group} />;
}
