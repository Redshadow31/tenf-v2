/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placehold.co', 'static-cdn.jtvnw.net', 'cdn.discordapp.com', 'clips-media-assets2.twitch.tv'],
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

