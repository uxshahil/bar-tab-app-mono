<script setup lang="ts">
const router = useRouter()

const errorStore = useErrorStore()

const error = ref(errorStore.activeError)

const message = ref('')
const customCode = ref(0)
const details = ref('')
const code = ref('')
const hint = ref('')
const statusCode = ref(0)

const isCustomError = ref(errorStore.isCustomError)

if (error.value && !('code' in error.value)) {
  message.value = error.value.message || 'An unexpected error occurred.'
  customCode.value = error.value.customCode ?? 500
}

if (error.value && 'code' in error.value) {
  message.value = error.value.message || 'An unexpected error occurred.'
  details.value = error.value.details || ''
  code.value = error.value.code || ''
  hint.value = error.value.hint || ''
  statusCode.value = error.value.statusCode ?? 500
}

const ErrorTemplate = import.meta.env.DEV
  ? defineAsyncComponent(() => import('./AppErrorDevSection.vue'))
  : defineAsyncComponent(() => import('./AppErrorProdSection.vue'))

router.afterEach(() => {
  errorStore.clearError()
})
</script>

<template>
  <section
    class="mx-auto flex justify-center items-center flex-1 p-10 text-center -mt-20 min-h-[90vh]"
  >
    <ErrorTemplate :message :customCode :details :code :hint :statusCode :isCustomError />
  </section>
</template>
