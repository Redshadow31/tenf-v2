import type { Metadata } from "next";
import InterviewsPublicPage from "@/components/interviews/InterviewsPublicPage";

export const metadata: Metadata = {
  title: "Interviews TENF",
  description: "Interviews YouTube TENF, classées Staff et Membres.",
  alternates: {
    canonical: "https://tenf-community.com/interviews",
  },
};

export default function InterviewsPage() {
  return <InterviewsPublicPage backHref="/" />;
}
