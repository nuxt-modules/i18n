<template>
  <div>
    <h1>{{ $t('welcome') }}</h1>
    <h2>Existing path</h2>
    <dl>
      <dt>Path:</dt>
      <dd>{{ path }}</dd>
      <dt>Localised path:</dt>
      <dd id="existing">{{ localePath(path) }}</dd>
      <dt>Router resolve from string:</dt>
      <dd>{{ resolvedPathFromString }}</dd>
      <dt>Router resolve from object:</dt>
      <dd>{{ resolvedPathFromObject }}</dd>
    </dl>

    <h2>Unexisting path</h2>
    <dl>
      <dt>Path:</dt>
      <dd>{{ wrong_path }}</dd>
      <dt>Localised path:</dt>
      <dd id="unexisting">{{ localePath(wrong_path) }}</dd>
      <dt>Router resolve from string:</dt>
      <dd>{{ resolvedWrongPathFromString }}</dd>
      <dt>Router resolve from object:</dt>
      <dd>{{ resolvedWrongPathFromObject }}</dd>
    </dl>
  </div>
</template>

<script setup>
const router = useRouter()
const localePath = useLocalePath()

const path = '/some-route?foo=bar'
const resolvedPathFromString = router.resolve(path)
const resolvedPathFromObject = router.resolve({ path })

const wrong_path = '/i-dont-exist?foo=bar'
const resolvedWrongPathFromString = router.resolve(wrong_path)
const resolvedWrongPathFromObject = router.resolve({ path: wrong_path })
</script>
