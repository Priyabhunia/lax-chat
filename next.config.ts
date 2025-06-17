// The red line appears because TypeScript can't find the 'next' module type declarations.
// You need to install the Next.js types package:
// npm install --save-dev @types/next
// Or if you're using Next.js 13+, the types are included in the 'next' package itself.
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/((?!api/).*)',
        destination: '/static-app-shell',
      },
    ];
  },
};

export default nextConfig;
