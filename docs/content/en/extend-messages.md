---
title: Extending messages hook
description: "Nuxt hook to extend app's messages"
position: 14
category: Guide
---
If you're a **module author** and want that module to provide extra messages for your project, you can merge them into the normally loaded messages by using the `i18n:extend-messages` hook.

To do this, in your module's setup file listen to the Nuxt hook and push your messages. `@nuxtjs/i18n` will do the rest.

This is particularly useful if your module use translated content and you want to offer to users nice default translations.

Example:

```js{}[my-module-exemple/setup.js]
export default function () {
  const { nuxt } = this

  nuxt.hook('i18n:extend-messages', function (additionalMessages) {
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
Because module's messages are merged with the project's ones, it's safer to prefix them.

Main project messages **will always override** the module's ones.
</alert>
