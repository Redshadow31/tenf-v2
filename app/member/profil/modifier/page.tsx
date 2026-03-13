import { redirect } from "next/navigation";

export default function MemberProfileEditRedirectPage() {
  redirect("/membres/me");
}
