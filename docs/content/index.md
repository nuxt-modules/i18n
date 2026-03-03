---
title: 'I18n for Nuxt Applications'
description: 'Internationalization module for your Nuxt project powered by Vue I18n.'
navigation: false
---

::u-page-hero
---
orientation: horizontal
links:
  - label: Get Started
    trailingIcon: i-heroicons-arrow-right-20-solid
    to: /docs/getting-started
    size: lg
  - label: Star on GitHub
    icon: i-simple-icons-github
    size: lg
    variant: ghost
    color: neutral
    to: https://github.com/nuxt-modules/i18n
    target: _blank
ui:
  container: 'relative overflow-hidden py-10 flex flex-col md:flex-row items-center gap-4'
  description: 'dark:text-gray-400 text-xl max-w-2xl leading-normal mb-10'
---

#top
:::div{class="absolute z-[-1] rounded-full bg-(--ui-primary) blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80"}
:::
:::div{class="absolute -z-10 inset-0 h-full w-full bg-[radial-gradient(circle,var(--ui-color-primary-900)_1px,transparent_1px)] bg-[size:20px_20px]"}
:::

#title
[I18n]{class="lg:hidden! inline"}[Internationalization]{class="hidden lg:inline!"} for [Nuxt Applications]{.text-primary}

#description
I18n (Internationalization) module for your Nuxt project powered by Vue I18n.

```bash [Terminal]
npx nuxi@latest module add i18n
```
::

::u-page-section
---
title: Build i18n-ready apps in seconds!
---

  ::u-page-grid
    ::u-page-card
    ---
    icon: i-simple-icons-i18next
    to: /docs/getting-started
    ---
    #title
    Vue I18n Integration

    #description
    Powered by Nuxt 3 for optimal performances and SEO.
    ::

    ::u-page-card
    ---
    icon: i-heroicons-sparkles-20-solid
    to: /docs/guide
    ---
    #title
    Automatic Routes Generation

    #description
    Auto override of Nuxt default routes to add your locales prefixes to every URL.
    ::

    ::u-page-card
    ---
    icon: i-heroicons-presentation-chart-line
    to: /docs/guide/seo
    ---
    #title
    Search Engine Optimization

    #description
    Composables to add SEO metadata based on current locale.
    ::

    ::u-page-card
    ---
    icon: i-heroicons-rocket-launch
    to: /docs/guide/lazy-load-translations
    ---
    #title
    Messages Lazy-Loading

    #description
    Lazy-load only the language that the users selected instead of bundling all the messages.
    ::

    ::u-page-card
    ---
    icon: i-heroicons-arrows-right-left
    to: /docs/components/nuxt-link-locale
    ---
    #title
    Locale-Aware Redirection

    #description
    Ready to use composables to redirect based on current locale.
    ::

    ::u-page-card
    ---
    icon: i-heroicons-globe-alt
    to: /docs/guide/different-domains
    ---
    #title
    Locales Specific Domains

    #description
    Set a different domain name for each locale your app supports.
    ::
  ::
::

::u-page-section
---
title: Sponsors
---

![Sponsors](https://raw.githubusercontent.com/bobbiegoede/static/main/sponsors.svg)
::

