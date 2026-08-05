import tailwindcss from '@tailwindcss/vite'

// Used to make social-preview tags absolute — crawlers won't resolve relative
// og:image URLs, and most ignore the tag entirely if it doesn't resolve.
const SITE_URL = 'https://pro-vision-pi.vercel.app'
const SITE_TITLE = 'ProVision — Memorize the 1987 Constitution'
const SITE_DESCRIPTION =
  'Commit the 1987 Philippine Constitution to memory with spaced repetition and five recall drills.'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Everything a learner does lives in their browser (localStorage), so there is
  // no server to render against. Client-only keeps the whole app one mental model
  // and lets `npm run generate` produce a static site you can host anywhere.
  ssr: false,

  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  // Filenames are already prefixed (UiButton, ModeBlanks), so don't let Nuxt
  // prepend the folder as well — `components/ui/UiButton.vue` stays <UiButton>.
  components: [{ path: '~/components', pathPrefix: false }],

  app: {
    head: {
      title: SITE_TITLE,
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: SITE_DESCRIPTION },
        { name: 'theme-color', content: '#1a1424' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'ProVision' },

        // Open Graph — Facebook, LinkedIn, Discord, Slack, iMessage, WhatsApp…
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'ProVision' },
        { property: 'og:title', content: SITE_TITLE },
        { property: 'og:description', content: SITE_DESCRIPTION },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:image', content: `${SITE_URL}/og-image.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        {
          property: 'og:image:alt',
          content: 'ProVision — Memorize the provision like a pro! The 1987 Philippine Constitution.',
        },
        { property: 'og:locale', content: 'en_PH' },

        // Twitter / X
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: SITE_TITLE },
        { name: 'twitter:description', content: SITE_DESCRIPTION },
        { name: 'twitter:image', content: `${SITE_URL}/og-image.png` },
      ],
      script: [
        {
          // Paint the right theme before Vue boots. Without this, a dark-theme
          // user sees a white flash on every cold load.
          innerHTML:
            "try{var s=JSON.parse(localStorage.getItem('provision.settings.v1')||'{}');" +
            "if(s.theme!=='light')document.documentElement.classList.add('dark')}" +
            "catch(e){document.documentElement.classList.add('dark')}",
          tagPosition: 'head',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'canonical', href: SITE_URL },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap',
        },
      ],
    },
  },
})
