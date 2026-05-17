import ModerationGroupPage from "@/components/admin/moderation/ModerationGroupPage";

export default function AdminModerationGroupRoute({
  params,
}: {
  params: { group: string };
}) {
  return <ModerationGroupPage view="admin" groupSlug={params.group} />;
}
