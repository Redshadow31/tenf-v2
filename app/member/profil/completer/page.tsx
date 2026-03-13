import { redirect } from "next/navigation";

export default function MemberProfileCompleteRedirectPage() {
  redirect("/membres/me?onboarding=1");
}
