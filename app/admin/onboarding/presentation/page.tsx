"use client";

import IntegrationPresentationPage from "../../evaluations/presentation-anime/page";

/** Point d’entrée dédié « Présentation » (évite les soucis de boundary RSC → client sur certains déploiements). */
export default function OnboardingPresentationHubPage() {
  return <IntegrationPresentationPage />;
}
