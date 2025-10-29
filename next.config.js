const withPWAInit = require('next-pwa');

const isProd = process.env.NODE_ENV === 'production';
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true' || process.env.GITHUB_PAGES === 'true';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
module.exports = {
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

const config = module.exports;

if (basePath) {
  config.basePath = basePath;
  config.assetPrefix = `${basePath}`;
}

if (isStaticExport) {
  config.output = 'export';
}

const disablePWA = !isProd || isStaticExport;

if (!disablePWA) {
  try {
    const withPWA = withPWAInit({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: false,
      publicExcludes: undefined
    });
    module.exports = withPWA(config);
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error(typeof error === 'string' ? error : 'Failed to initialize next-pwa');
    normalizedError.name = 'NextConfigError';
    throw normalizedError;
  }
}
