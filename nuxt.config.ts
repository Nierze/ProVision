import tailwindcss from '@tailwindcss/vite'

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
      title: 'ProVision — Learn the 1987 Constitution',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'Commit the 1987 Philippine Constitution to memory with spaced repetition and five recall drills.',
        },
        { name: 'theme-color', content: '#0e0817' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
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
