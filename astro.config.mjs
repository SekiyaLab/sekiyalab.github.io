// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  site: 'https://sekiyalab.github.io',
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      /* 'css-variables' emits var(--astro-code-token-*) instead of literal
       * theme colours, so code blocks stay inside the site's own neutral
       * scale — see :root in tokens.css — instead of importing a separate
       * multi-colour syntax palette. */
      theme: 'css-variables',
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
