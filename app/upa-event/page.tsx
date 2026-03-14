import "./upa-event.css";
import UpaEventLandingClient from "./UpaEventLandingClient";
import { getUpaEventConfig } from "@/lib/upaEvent/getUpaEventConfig";

export const dynamic = "force-dynamic";

export default async function UpaEventPage() {
  const config = await getUpaEventConfig("upa-event");
  return <UpaEventLandingClient initialContent={config} />;
}
