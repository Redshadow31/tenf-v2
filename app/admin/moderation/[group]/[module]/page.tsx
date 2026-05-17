import ModerationModuleRouter from "@/components/admin/moderation/ModerationModuleRouter";

export default function AdminModerationModuleRoute({
  params,
}: {
  params: { group: string; module: string };
}) {
  return (
    <ModerationModuleRouter
      view="admin"
      groupSlug={params.group}
      moduleSlug={params.module}
    />
  );
}
