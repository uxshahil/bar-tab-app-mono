<script setup lang="ts">
import router from '@/router'
import { register } from '@/services/supabase/auth'
import { UserRole } from '@/types/TypesAuth'

import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const formSchema = toTypedSchema(
  z
    .object({
      username: z.string().min(2, 'Username must be at least 2 characters'),
      firstName: z.string().min(2, 'First name must be at least 2 characters'),
      lastName: z.string().min(2, 'Last name must be at least 2 characters'),
      email: z.string().email('Not a valid email format'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
})

const onSubmit = form.handleSubmit(async (values) => {
  const isRegistered = await register({
    username: values.username,
    email: values.email,
    password: values.password,
    confirmPassword: values.confirmPassword,
    firstName: values.firstName,
    lastName: values.lastName,
    pin: '',
    role: UserRole.BarManager,
  })
  if (isRegistered) router.push('/')
})
</script>

<template>
  <div
    class="mx-auto w-full flex justify-center items-center p-10 text-center -mt-10 min-h-[90vh] h-full"
  >
    <Card class="max-w-sm w-full mx-auto h-full">
      <CardHeader>
        <CardTitle class="text-2xl"> Register </CardTitle>
        <CardDescription> Create a new account </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col gap-4 mb-4 justify-center items-center">
          <Button variant="outline" class="w-full"> Register with Google </Button>
          <Separator label="Or" />
        </div>
        <form class="grid gap-4" @submit="onSubmit">
          <FormField v-slot="{ componentField }" name="username">
            <FormItem class="text-left">
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input type="text" placeholder="johndoe19" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <div class="flex flex-col sm:flex-row justify-between gap-4">
            <FormField v-slot="{ componentField }" name="firstName">
              <FormItem class="text-left w-full">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="John" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="lastName">
              <FormItem class="text-left w-full">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Doe" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

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
                <Input type="password" placeholder="*****" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="confirmPassword">
            <FormItem class="text-left">
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="*****" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full"> Register </Button>
        </form>
        <div class="mt-4 text-sm text-center">
          Already have an account?
          <RouterLink to="/login" class="underline"> Login </RouterLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
