<script setup lang="ts">
import { posLogin } from '@/services/supabase/auth'
import { watchDebounced } from '@vueuse/core'

const formData = ref({
  pin: '',
})

const { serverError, handleServerError, posLoginFormErrors, handlePosLoginForm } = useFormErrors()

const router = useRouter()

watchDebounced(
  formData,
  () => {
    handlePosLoginForm(formData.value)
  },
  { debounce: 1000, deep: true },
)

const signin = async () => {
  const { error } = await posLogin(formData.value)
  if (error) {
    handleServerError(error)
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="mx-auto flex w-full justify-center items-center p-10 text-center -mt-20 min-h-[90vh]">
    <Card class="max-w-sm w-full mx-auto">
      <CardHeader>
        <CardTitle class="text-2xl">POS Login</CardTitle>
        <CardDescription> Login to your account </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="signin">
          <div class="grid gap-2">
            <div class="flex items-center">
              <Label id="pin">Pin</Label>
            </div>
            <Input
              id="pin"
              type="password"
              autocomplete
              required
              v-model="formData.pin"
              :class="{ 'border-red-500': serverError }"
            />
          </div>
          <ul class="text-sm text-left text-red-500" v-if="posLoginFormErrors?.pin">
            <li v-for="error in posLoginFormErrors.pin" :key="error" class="list-disc">
              {{ error }}
            </li>
          </ul>
          <ul class="text-sm text-left text-red-500" v-if="serverError">
            <li class="list-disc">{{ serverError }}</li>
          </ul>
          <Button type="submit" class="w-full"> Login </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
