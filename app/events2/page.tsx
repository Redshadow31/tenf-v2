// Conservé pendant la phase de migration vers /evenements (URL officielle).
// Le composant client a été extrait dans components/events2/EvenementsAgendaClient.tsx
// pour être partagé entre les deux routes. Le redirect 301 /events2 → /evenements
// déclaré dans next.config.js absorbe le trafic résiduel ; ce fichier sert de
// filet de sécurité pour les liens Google Calendar persistés chez les membres.
import EvenementsAgendaClient from "@/components/events2/EvenementsAgendaClient";

export default function Events2Page() {
  return <EvenementsAgendaClient />;
}
