import withPWA from 'next-pwa';

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
  trailingSlash: isStaticExport,
  ...(basePath
    ? {
        basePath,
        assetPrefix: `${basePath}`
      }
    : {}),
  ...(isStaticExport ? { output: 'export' } : {})
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProd,
  publicExcludes: isStaticExport ? ['!workbox-*.js', '!worker-*.js'] : undefined
})(nextConfig);
