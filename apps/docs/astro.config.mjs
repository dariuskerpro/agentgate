import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'AgentGate',
      description: 'Monetize any API in 3 lines of code with x402 payments',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/dariuskerpro/agentgate' },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          autogenerate: { directory: 'getting-started' },
        },
        {
          label: 'API Reference',
          autogenerate: { directory: 'api' },
        },
        {
          label: 'Middleware',
          autogenerate: { directory: 'middleware' },
        },
        {
          label: 'Architecture',
          autogenerate: { directory: 'architecture' },
        },
      ],
    }),
  ],
});
