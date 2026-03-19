import type { Metadata } from "next";
import InterviewsPublicPage from "@/components/interviews/InterviewsPublicPage";

export const metadata: Metadata = {
  title: "Interviews TENF | VIP",
  description: "Interviews vidéo TENF séparées entre Staff et Membres.",
};

export default function InterviewsPage() {
  return <InterviewsPublicPage backHref="/vip" />;
}


