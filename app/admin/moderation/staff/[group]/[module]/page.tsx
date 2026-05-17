import ModerationModuleRouter from "@/components/admin/moderation/ModerationModuleRouter";

export default function AdminModerationStaffModuleRoute({
  params,
}: {
  params: { group: string; module: string };
}) {
  return (
    <ModerationModuleRouter
      view="staff"
      groupSlug={params.group}
      moduleSlug={params.module}
    />
  );
}
