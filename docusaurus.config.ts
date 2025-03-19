import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: `Tintin's Node.js GStreamer Cookbook`,
  tagline: `🚀 TypeScript + Node-Gtk + GStreamer Examples`,
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://babyducktw.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/node-gstreamer-cookbook/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'babyducktw', // Usually your GitHub org/user name.
  projectName: 'node-gstreamer-cookbook', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hant',
    locales: ['zh-Hant'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/babyducktw/node-gstreamer-cookbook/edit/master/',
        },
        blog: false,
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: `Tintin's Node.js GStreamer Cookbook`,
      logo: {
        alt: 'Babyduck Logo',
        src: 'img/babyduck.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Tutorial',
        },
        {
          href: 'https://github.com/babyducktw/node-gstreamer-cookbook',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GStreamer Discourse',
              href: 'https://discourse.gstreamer.org',
            },
            {
              label: 'Node-Gtk Discord',
              href: 'https://github.com/romgrk/node-gtk?tab=readme-ov-file#contributing',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/babyducktw/node-gstreamer-cookbook',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Tintin's Node.js GStreamer Cookbook. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
