<script setup lang="ts">
import { useTabsStore } from '@/stores/loaders/tabs'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { todaysTabsCountQuery } from '@/services/supabase/queries/tabQueries'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const sheetOpen = defineModel<boolean>()
const tabsStore = useTabsStore()
const authStore = useAuthStore()
const { profile } = storeToRefs(authStore)

const initialTabNumber = ref('')

const formSchema = toTypedSchema(
  z.object({
    tab_number: z.string(),
    user_id: z.string(),
    special_notes: z.string().max(500, 'Max 500 characters').optional(),
  }),
)

const form = useForm({
  validationSchema: formSchema,
})

// Generate unique tab number
const generateTabNumber = async () => {
  const { count } = await todaysTabsCountQuery()
  const nextCount = (count || 0) + 1

  const today = new Date()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  const sequence = nextCount.toString().padStart(4, '0')

  return `TAB-${month}${day}-${sequence}`
}

watch(sheetOpen, async (isOpen) => {
  if (isOpen) {
    const tabNum = await generateTabNumber()
    initialTabNumber.value = tabNum
    form.setValues({
      tab_number: tabNum,
      user_id: profile.value?.id || '',
      special_notes: '',
    })
  }
})

const onSubmit = form.handleSubmit(async (values) => {
  if (!values.user_id || !values.tab_number) return

  const tabId = await tabsStore.createTab({
    user_id: values.user_id,
    bar_id: 1,
    tab_number: values.tab_number,
    special_notes: values.special_notes || null,
    status: 'open',
    subtotal: 0,
    tax_amount: 0,
    total_before_tip: 0,
    tip_amount: 0,
    total_owed: 0,
  })

  if (tabId) {
    sheetOpen.value = false
  }
})
</script>

<template>
  <Sheet v-model:open="sheetOpen">
    <SheetContent class="overflow-y-auto max-h-screen px-4">
      <SheetHeader>
        <SheetTitle>Create New Tab</SheetTitle>
      </SheetHeader>

      <form @submit="onSubmit" class="space-y-6 mt-6">
        <FormField v-slot="{ componentField }" name="tab_number">
          <FormItem>
            <FormLabel>Tab Number</FormLabel>
            <FormControl>
              <Input v-bind="componentField" disabled placeholder="Auto-generated" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="user_id">
          <FormItem>
            <FormLabel>Assigned To</FormLabel>
            <FormControl>
              <Input
                v-bind="componentField"
                disabled
                :placeholder="profile?.full_name || 'Current User'"
              />
            </FormControl>
            <p class="text-xs text-muted-foreground pl-1">
              Tab assigned to: {{ profile?.full_name }}
            </p>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="special_notes">
          <FormItem>
            <FormLabel>Description / Location</FormLabel>
            <FormControl>
              <Textarea
                v-bind="componentField"
                placeholder="e.g., Table 5, Bar Seat, VIP"
                rows="3"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <Button type="submit">Create Tab</Button>
      </form>
    </SheetContent>
  </Sheet>
</template>
