---
title: Extending locales hook
description: "nuxt hook to add lerge messages"
position: 14
category: Guide
---

If you're a **module author** you can merge extra translations into the project where your module is installed by using the `i18n:extend-locales` hook.

To do this, in your module's setup file listen to the nuxt hook and push your translations, `@nuxtjs/i18n` will do the rest.

This is particulary useful if your module use translated content and you want to offer to users nice default translations.

Exemple:
```js{}[my-module-exemple/setup.js]
export default function () {
  const { nuxt } = this

  nuxt.hook('i18n:extend-locales', function (additionalMessages) {
    additionalMessages.push({
      en: {
        'my-module-exemple': {
          hello: 'Hello from external module'
        }
      },
      fr: {
        'my-module-exemple': {
          hello: 'Bonjour depuis le module externe'
        }
      }
    })
  })
}
```
Now the project has access to new messages and can use them through `$t('my-module-exemple.hello')`.

<alert>
Because module's translation are merged with the project's ones, it's safer to prefix them.

**Main project translations will always override** the module's ones.
</alert>
