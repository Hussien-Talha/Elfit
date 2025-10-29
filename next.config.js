const withPWAInit = require('next-pwa');

const isProd = process.env.NODE_ENV === 'production';
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    serverActions: true
  },
  images: {
    remotePatterns: [],
    unoptimized: isStaticExport
  },
  trailingSlash: isStaticExport
};

if (basePath) {
  nextConfig.basePath = basePath;
  nextConfig.assetPrefix = `${basePath}`;
}

if (isStaticExport) {
  nextConfig.output = 'export';
}

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProd,
  publicExcludes: isStaticExport ? ['!workbox-*.js', '!worker-*.js'] : undefined
});

module.exports = withPWA(nextConfig);
