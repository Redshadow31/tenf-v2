import { CommunauteEventsHubProvider } from "@/lib/admin/CommunauteEventsHubContext";

export default function CommunauteEvenementsLayout({ children }: { children: React.ReactNode }) {
  return <CommunauteEventsHubProvider>{children}</CommunauteEventsHubProvider>;
}
