import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Image optimization settings
  images: {
    // Allow images from external domains if needed
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yuscihvpfeuiwesuyouj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Optimize images for better performance
    formats: ['image/webp', 'image/avif'],
    // Set minimum cache time for images - 1 year to reduce egress costs
    minimumCacheTTL: 31536000,
    // Enable device pixel ratio optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Webpack configuration for better bundle optimization (only when not using Turbopack)
  ...(!process.argv.includes('--turbopack') && {
    webpack: (config, { dev, isServer }) => {
      // Only apply webpack optimizations in production
      if (!dev && !isServer) {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        };
      }

      // Improve file system stability
      if (dev) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        };
      }

      return config;
    },
  }),

  // Environment variables configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Output configuration
  output: 'standalone',

  // Trailing slash configuration
  trailingSlash: false,

  // Disable server-side rendering for pages that use Firebase
  // This helps prevent build-time Firebase initialization issues
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },

  // Base path configuration (if needed for deployment)
  // basePath: '',

  // Asset prefix configuration (if needed for CDN)
  // assetPrefix: '',
};

export default nextConfig;
