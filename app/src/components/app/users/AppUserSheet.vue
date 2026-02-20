<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CreateNewUser, EditUser } from '@/interfaces/UserInterfaces'
import profileApi from '@/services/api/profileApi'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const userSheetStore = useUserSheetStore()
const { isOpen, userToEdit } = storeToRefs(userSheetStore)
const { closeSheet } = userSheetStore

const isEditing = computed(() => !!userToEdit.value)

const selectOptions = {
  roles: [
    { label: 'Admin', value: 'admin' },
    { label: 'Bar Staff', value: 'bar-staff' },
    { label: 'Bar Manager', value: 'bar-manager' },
  ],
}

const formSchema = computed(() =>
  toTypedSchema(
    z.object({
      firstName: z.string().min(1, 'First name is required').max(255),
      lastName: z.string().min(1, 'Last name is required').max(255),
      username: z.string().min(1, 'Username is required').max(255),
      email: z.string().email('Invalid email address'),
      password: isEditing.value
        ? z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal(''))
        : z.string().min(8, 'Password must be at least 8 characters'),
      pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
      user_role: z.enum(['admin', 'bar-staff', 'bar-manager'], {
        errorMap: () => ({ message: 'Please select a role' }),
      }),
      bio: z.string().max(500).optional(),
      avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
    }),
  ),
)

const form = useForm({
  validationSchema: formSchema,
})

// Watch for userToEdit changes to populate form
watch(
  userToEdit,
  (newUser) => {
    if (newUser) {
      // Split full name if possible
      const [first, ...last] = (newUser.full_name || '').split(' ')
      form.setValues({
        firstName: first || '',
        lastName: last.join(' ') || '',
        username: newUser.username || '',
        email: newUser.email || '',
        password: '',
        pin: newUser.pin ? String(newUser.pin) : '',
        user_role: newUser.user_role as 'admin' | 'bar-staff' | 'bar-manager',
        bio: newUser.bio || '',
        avatar_url: newUser.avatar_url || '',
      })
    } else {
      // Reset form for create mode
      form.resetForm()
    }
  },
  { immediate: true },
)

const onSubmit = form.handleSubmit(async (values) => {
  const userData = {
    ...values,
    full_name: `${values.firstName} ${values.lastName}`,
    // Ensure numeric pin string
    pin: values.pin,
  }

  try {
    if (isEditing.value && userToEdit.value) {
      // Only include password if provided
      if (!userData.password) delete userData.password

      // Sanitize data for profile table (remove non-columns)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { firstName: _firstName, lastName: _lastName, ...cleanData } = userData

      const editPayload: EditUser = {
        id: userToEdit.value.id,
        data: cleanData,
      }
      await profileApi.editProfile(editPayload)
      await useUsersStore().getUsers()
    } else {
      // Ensure password is present for creation (it is required by schema, but types might need assertion)
      await profileApi.createProfile(userData as CreateNewUser)
      await useUsersStore().getUsers()
    }
    closeSheet()
  } catch (error) {
    console.error('Error saving user:', error)
  }
})
</script>

<template>
  <Sheet :open="isOpen" @update:open="(v) => !v && closeSheet()">
    <SheetContent class="overflow-y-auto max-h-screen px-4">
      <SheetHeader>
        <SheetTitle>{{ isEditing ? 'Edit User' : 'Create New User' }}</SheetTitle>
      </SheetHeader>

      <form @submit="onSubmit" class="space-y-4 mt-4">
        <div class="grid grid-cols-2 gap-4">
          <FormField v-slot="{ componentField }" name="firstName">
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input v-bind="componentField" placeholder="Enter first name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="lastName">
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input v-bind="componentField" placeholder="Enter last name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <FormField v-slot="{ componentField }" name="username">
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter username" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                v-bind="componentField"
                placeholder="Enter email"
                type="email"
                :disabled="isEditing"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input v-bind="componentField" type="password" placeholder="Enter password" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="pin">
          <FormItem>
            <FormLabel>PIN</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter 4-digit PIN" maxlength="4" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="user_role">
          <FormItem>
            <FormLabel>Role</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem
                  v-for="option in selectOptions.roles"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="bio">
          <FormItem>
            <FormLabel>Biography</FormLabel>
            <FormControl>
              <Textarea v-bind="componentField" placeholder="Enter bio" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="avatar_url">
          <FormItem>
            <FormLabel>Avatar URL</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter avatar URL" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <Button type="submit">{{ isEditing ? 'Save Changes' : 'Create User' }}</Button>
      </form>
    </SheetContent>
  </Sheet>
</template>
