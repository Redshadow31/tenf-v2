/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placehold.co', 'static-cdn.jtvnw.net', 'cdn.discordapp.com', 'clips-media-assets2.twitch.tv', 'unavatar.io'],
  },
  async redirects() {
    return [
      {
        source: '/communaute/partenaires',
        destination: '/partenaire-tenf',
        permanent: true,
      },
      {
        source: '/upa-event',
        destination: '/partenaire-tenf',
        permanent: true,
      },
      {
        source: '/admin/onboarding/discours',
        destination: '/admin/onboarding/discours2',
        permanent: true,
      },
      {
        source: '/admin/integration',
        destination: '/admin/onboarding',
        permanent: true,
      },
      {
        source: '/admin/integration/planification',
        destination: '/admin/onboarding/sessions',
        permanent: true,
      },
      {
        source: '/admin/integration/inscription',
        destination: '/admin/onboarding/inscriptions',
        permanent: true,
      },
      {
        source: '/admin/integration/inscription-moderateur',
        destination: '/admin/onboarding/staff',
        permanent: true,
      },
      {
        source: '/admin/integration/presence-retour',
        destination: '/admin/onboarding/presences',
        permanent: true,
      },
      {
        source: '/admin/integration/statistique',
        destination: '/admin/onboarding/kpi',
        permanent: true,
      },
      {
        source: '/admin/integration/presentation',
        destination: '/admin/onboarding/presentation-anime',
        permanent: true,
      },
      {
        source: '/admin/integration/presentation-anime',
        destination: '/admin/onboarding/presentation-anime',
        permanent: true,
      },
      {
        source: '/admin/integration/discours2/:path*',
        destination: '/admin/onboarding/discours2/:path*',
        permanent: true,
      },
      {
        source: '/admin/integration/discours/:path*',
        destination: '/admin/onboarding/contenus',
        permanent: true,
      },
      {
        source: '/admin/evaluations',
        destination: '/admin/onboarding',
        permanent: true,
      },
      {
        source: '/admin/evaluations/planification',
        destination: '/admin/onboarding/sessions',
        permanent: true,
      },
      {
        source: '/admin/evaluations/inscription',
        destination: '/admin/onboarding/inscriptions',
        permanent: true,
      },
      {
        source: '/admin/evaluations/inscription-moderateur',
        destination: '/admin/onboarding/staff',
        permanent: true,
      },
      {
        source: '/admin/evaluations/presence-retour',
        destination: '/admin/onboarding/presences',
        permanent: true,
      },
      {
        source: '/admin/evaluations/statistique',
        destination: '/admin/onboarding/kpi',
        permanent: true,
      },
      {
        source: '/admin/evaluations/presentation',
        destination: '/admin/onboarding/presentation-anime',
        permanent: true,
      },
      {
        source: '/admin/evaluations/presentation-anime',
        destination: '/admin/onboarding/presentation-anime',
        permanent: true,
      },
      {
        source: '/admin/evaluations/discours2/:path*',
        destination: '/admin/onboarding/discours2/:path*',
        permanent: true,
      },
      {
        source: '/admin/evaluations/discours/:path*',
        destination: '/admin/onboarding/contenus',
        permanent: true,
      },
      {
        source: '/admin/integration/:path*',
        destination: '/admin/onboarding/:path*',
        permanent: true,
      },
      {
        source: '/admin/evaluations/:path*',
        destination: '/admin/onboarding/:path*',
        permanent: true,
      },
      {
        source: '/admin/events',
        destination: '/admin/communaute',
        permanent: true,
      },
      {
        source: '/admin/events/planification',
        destination: '/admin/communaute/evenements/calendrier',
        permanent: true,
      },
      {
        source: '/admin/events/liste',
        destination: '/admin/communaute/evenements',
        permanent: true,
      },
      {
        source: '/admin/events/presence',
        destination: '/admin/communaute/evenements/participation',
        permanent: true,
      },
      {
        source: '/admin/events/recap',
        destination: '/admin/communaute/evenements/participation',
        permanent: true,
      },
      {
        source: '/admin/events/propositions',
        destination: '/admin/communaute/evenements/propositions',
        permanent: true,
      },
      {
        source: '/admin/events/liens-vocaux',
        destination: '/admin/communaute/evenements/liens-vocaux',
        permanent: true,
      },
      {
        source: '/admin/events/archives',
        destination: '/admin/communaute/evenements/archives',
        permanent: true,
      },
      {
        source: '/admin/events/spotlight',
        destination: '/admin/communaute/evenements/spotlight',
        permanent: true,
      },
      {
        source: '/admin/events/spotlight/presences',
        destination: '/admin/communaute/evenements/spotlight/presences',
        permanent: true,
      },
      {
        source: '/admin/events/spotlight/analytics',
        destination: '/admin/communaute/evenements/spotlight/analytics',
        permanent: true,
      },
      {
        source: '/admin/events/anniversaires',
        destination: '/admin/communaute/anniversaires',
        permanent: true,
      },
      {
        source: '/admin/events/anniversaires/mois',
        destination: '/admin/communaute/anniversaires/mois',
        permanent: true,
      },
      {
        source: '/admin/events/anniversaires/tous',
        destination: '/admin/communaute/anniversaires/tous',
        permanent: true,
      },
      {
        source: '/admin/spotlight',
        destination: '/admin/communaute/evenements/spotlight',
        permanent: true,
      },
      {
        source: '/admin/spotlight/gestion',
        destination: '/admin/communaute/evenements/spotlight/gestion',
        permanent: true,
      },
      {
        source: '/admin/spotlight/evaluation',
        destination: '/admin/communaute/evenements/spotlight/evaluation',
        permanent: true,
      },
      {
        source: '/admin/spotlight/membres',
        destination: '/admin/communaute/evenements/spotlight/membres',
        permanent: true,
      },
      {
        source: '/admin/spotlight/presence',
        destination: '/admin/communaute/evenements/spotlight/presences',
        permanent: true,
      },
      {
        source: '/admin/spotlight/recover',
        destination: '/admin/communaute/evenements/spotlight/recover',
        permanent: true,
      },
      {
        source: '/admin/membres/spotlight',
        destination: '/admin/communaute/evenements/spotlight/gestion',
        permanent: true,
      },
      {
        source: '/admin/engagement/follow',
        destination: '/admin/communaute/engagement/follow',
        permanent: true,
      },
      {
        source: '/admin/follow',
        destination: '/admin/communaute/engagement/feuilles-follow',
        permanent: true,
      },
      {
        source: '/admin/follow/config',
        destination: '/admin/communaute/engagement/config-follow',
        permanent: true,
      },
      {
        source: '/admin/follow/:slug',
        destination: '/admin/communaute/engagement/feuilles-follow',
        permanent: true,
      },
      {
        source: '/admin/engagement/raids-sub',
        destination: '/admin/communaute/engagement/raids-eventsub',
        permanent: true,
      },
      {
        source: '/admin/engagement/raids-a-valider',
        destination: '/admin/communaute/engagement/signalements-raids',
        permanent: true,
      },
      {
        source: '/admin/engagement/historique-raids',
        destination: '/admin/communaute/engagement/historique-raids',
        permanent: true,
      },
      {
        source: '/admin/engagement/points-discord',
        destination: '/admin/communaute/engagement/points-discord',
        permanent: true,
      },
      {
        source: '/admin/raids',
        destination: '/admin/communaute/engagement/signalements-raids',
        permanent: true,
      },
      {
        source: '/admin/raids/review',
        destination: '/admin/communaute/engagement/signalements-raids',
        permanent: true,
      },
      {
        source: '/admin/engagement/raids-test/:path*',
        destination: '/admin/communaute/engagement/raids-eventsub',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [];
  },
  async headers() {
    return [
      {
        source: '/vip/clips',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.twitch.tv https://clips.twitch.tv; frame-src https://*.twitch.tv https://clips.twitch.tv;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

