/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.utdstc.com',
      },

      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
      },
      {
        protocol: 'https',
        hostname: 'pollinations.ai',
      },

      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      // Cloudinary domains for uploaded assets
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '0c1ud2h7ms.ufs.sh',
      },
      {
        protocol: 'https',
        hostname: '**.ufs.sh',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/coursify/r/:slug',
        destination: 'https://coursify.hasanraiyan.me/r/:slug',
        permanent: true,
      },
      {
        source: '/coursify',
        destination: 'https://coursify.hasanraiyan.me',
        permanent: true,
      },
      {
        source: '/coursify/:path*',
        destination: 'https://coursify.hasanraiyan.me/:path*',
        permanent: true,
      },
      {
        source: '/api/coursify/:path*',
        destination: 'https://coursify.hasanraiyan.me/api/coursify/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
