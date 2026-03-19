import { redirect } from "next/navigation";

type StaffModerationModulePageProps = {
  params: {
    group: string;
    module: string;
  };
};

export default function StaffModerationModulePage({ params }: StaffModerationModulePageProps) {
  redirect(`/admin/moderation/staff/${params.group}/${params.module}`);
}
