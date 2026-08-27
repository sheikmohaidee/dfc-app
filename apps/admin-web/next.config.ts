import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Static export: `next build` writes plain HTML/JS to `out/`, which Firebase
   * Hosting serves straight from its CDN.
   *
   * This is not a compromise, it is the right shape for this app. The admin
   * console talks to Firestore directly from the browser and the security
   * rules are the boundary — there is no server-side rendering to do, no
   * secret to keep server-side, and no session to manage. Rendering it on a
   * server would add a Cloud Run bill and a cold start to buy nothing.
   *
   * The consequence to remember: no API routes, no server actions, no
   * middleware. If one is ever genuinely needed it belongs in Cloud Functions
   * (firebase/functions) next to the rest of the server logic, not here.
   */
  output: 'export',

  // Static export cannot run the image optimiser — it needs a server.
  images: { unoptimized: true },

  // @dfc/core ships TypeScript source, not a build step. Next compiles it.
  transpilePackages: ['@dfc/core'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
