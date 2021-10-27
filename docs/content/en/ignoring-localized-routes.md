---
title: Ignoring localized routes
description: "Customize localized route exlusions per page component."
position: 7
category: Guide
---

<alert type="warning">

This feature is not supported with the `no-prefix` [strategy](/strategies).

</alert>

If you'd like some pages to be available in some languages only, you can configure the list of supported languages to override the global settings. The options can be specified within either the page components themselves or globaly, within then module options.

### Pick localized routes

<code-group>
  <code-block label="Page component" active>

  ```js {}[pages/about.vue]
  export default {
    nuxtI18n: {
      locales: ['fr', 'es']
    }
  }
  ```

  </code-block>
  <code-block label="Module configuration">

  ```js {}[nuxt.config.js]
  i18n: {
    parsePages: false,
    pages: {
      about: {
        en: false,
      }
    }
  }
  ```

  </code-block>
</code-group>

### Disable localized routes

<code-group>
  <code-block label="Page component" active>

  ```js {}[pages/about.vue]
  export default {
    nuxtI18n: false
  }
  ```

  </code-block>
  <code-block label="Module configuration">

  ```js {}[nuxt.config.js]
  i18n: {
    parsePages: false,
    pages: {
      about: false
    }
  }
  ```

  </code-block>
</code-group>
