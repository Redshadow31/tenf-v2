import { redirect } from "next/navigation";

type StaffGroupPageProps = {
  params: {
    group: string;
  };
};

export default function StaffModerationGroupPage({ params }: StaffGroupPageProps) {
  redirect(`/admin/moderation/staff/${params.group}`);
}
