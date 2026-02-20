<script setup lang="ts">
import { posLogin } from '@/services/supabase/auth'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const formSchema = toTypedSchema(
  z.object({
    pin: z.string().regex(/^\d{6}$|^\d{9}$/, 'Invalid pin'),
  }),
)

const form = useForm({
  validationSchema: formSchema,
})

const router = useRouter()

const onSubmit = form.handleSubmit(async (values) => {
  const { error } = await posLogin(values)
  if (error) {
    form.setErrors({
      pin: error.message,
    })
  } else {
    router.push('/')
  }
})
</script>

<template>
  <div class="mx-auto flex w-full justify-center items-center p-10 text-center -mt-20 min-h-[90vh]">
    <Card class="max-w-sm w-full mx-auto">
      <CardHeader>
        <CardTitle class="text-2xl">POS Login</CardTitle>
        <CardDescription> Login to your account </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit="onSubmit">
          <FormField v-slot="{ componentField }" name="pin">
            <FormItem>
              <FormLabel>Pin</FormLabel>
              <FormControl>
                <Input type="password" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full"> Login </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
