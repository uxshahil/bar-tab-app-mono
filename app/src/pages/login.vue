<script setup lang="ts">
import { login } from '@/services/supabase/auth'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const formSchema = toTypedSchema(
  z.object({
    email: z.string().email('Not a valid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
)

const form = useForm({
  validationSchema: formSchema,
})

const router = useRouter()

const onSubmit = form.handleSubmit(async (values) => {
  const { error } = await login(values)
  if (error) {
    if (error.message === 'Invalid login credentials') {
      form.setFieldError('email', 'Incorrect email or password')
      form.setFieldError('password', 'Incorrect email or password')
    } else {
      // Ideally use toast here, but fallback to form error if no toast
      form.setErrors({
        email: error.message,
      })
    }
  } else {
    router.push('/')
  }
})
</script>

<template>
  <div class="mx-auto flex w-full justify-center items-center p-10 text-center -mt-20 min-h-[90vh]">
    <Card class="max-w-sm w-full mx-auto">
      <CardHeader>
        <CardTitle class="text-2xl"> Login </CardTitle>
        <CardDescription> Login to your account </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit="onSubmit">
          <FormField v-slot="{ componentField }" name="email">
            <FormItem class="text-left">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="johndoe19@example.com" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="password">
            <FormItem class="text-left">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full"> Login </Button>
        </form>
        <div class="mt-4 text-sm text-center flex flex-col">
          <span>Don't have an account?</span>
          <RouterLink to="/readme" class="underline"> Check the README.MD </RouterLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
