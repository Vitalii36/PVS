import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import rehypePrettyCode from 'rehype-pretty-code';

// `base` is the URL prefix the site is served under.
// Default '/PVS/' assumes the GitHub repo is named `PVS`.
// See: specs/001-portfolio-blog-site/contracts/build-deploy.md
//      specs/001-portfolio-blog-site/research.md (Open decision: base: '/PVS/')
export default defineConfig({
  site: 'https://Vitalii36.github.io',
  base: '/PVS/',
  output: 'static',
  trailingSlash: 'always',

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: {
            light: 'github-light-default',
            dark: 'github-dark-default',
          },
          keepBackground: false,
        },
      ],
    ],
  },
});
