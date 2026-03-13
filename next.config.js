/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placehold.co', 'static-cdn.jtvnw.net', 'cdn.discordapp.com', 'clips-media-assets2.twitch.tv', 'unavatar.io'],
  },
  async redirects() {
    return [
      {
        source: '/admin/integration/discours',
        destination: '/admin/integration/discours2',
        permanent: true,
      },
      {
        source: '/admin/integration/presentation',
        destination: '/admin/integration/presentation-anime',
        permanent: true,
      },
      {
        source: '/admin/evaluations/discours',
        destination: '/admin/integration/discours2',
        permanent: true,
      },
      {
        source: '/admin/evaluations/presentation',
        destination: '/admin/integration/presentation-anime',
        permanent: true,
      },
      {
        source: '/admin/evaluations/:path*',
        destination: '/admin/integration/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/admin/integration/:path*',
        destination: '/admin/evaluations/:path*',
      },
      {
        source: '/admin/integration',
        destination: '/admin/evaluations',
      },
    ];
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

