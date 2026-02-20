<template>
  <div class="space-y-4">
    <!-- Tab Actions -->
    <div class="flex gap-2">
      <Button @click="showNewTabSheet = true">New Tab</Button>
      <Button variant="outline" @click="showOpenTabSheet = true">Open Existing</Button>
    </div>

    <!-- Current Tab Display -->
    <div v-if="currentTab" class="border rounded-lg p-4">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="font-semibold">{{ currentTab.tab_number }}</h3>
          <p class="text-sm text-muted-foreground">
            Total: ${{ currentTab.total_owed.toFixed(2) }}
          </p>
        </div>
        <Button variant="outline" size="sm" @click="showAddItemSheet = true">Add Item</Button>
      </div>

      <!-- Tab Items -->
      <div v-if="tabItems?.length" class="space-y-2">
        <div
          v-for="item in tabItems"
          :key="item.id"
          class="flex justify-between items-center p-2 bg-muted rounded"
        >
          <div>
            <span class="font-medium">Item #{{ item.menu_item_id }}</span>
            <span class="text-sm text-muted-foreground ml-2">x{{ item.quantity }}</span>
          </div>
          <span>${{ item.item_total.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- New Tab Sheet -->
    <Sheet v-model:open="showNewTabSheet">
      <SheetContent class="overflow-y-auto max-h-screen px-4">
        <SheetHeader>
          <SheetTitle>Create New Tab</SheetTitle>
        </SheetHeader>
        <form @submit="onNewTabSubmit" class="space-y-4 mt-4">
          <FormField v-slot="{ componentField }" name="tab_number">
            <FormItem>
              <FormLabel>Tab Number</FormLabel>
              <FormControl>
                <Input v-bind="componentField" disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="user_id">
            <FormItem>
              <FormLabel>Assigned To</FormLabel>
              <FormControl>
                <Input v-bind="componentField" disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="special_notes">
            <FormItem>
              <FormLabel>Special Notes</FormLabel>
              <FormControl>
                <Textarea v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit">Create Tab</Button>
        </form>
      </SheetContent>
    </Sheet>

    <!-- Open Existing Tab Sheet -->
    <Sheet v-model:open="showOpenTabSheet">
      <SheetContent class="overflow-y-auto max-h-screen px-4">
        <SheetHeader>
          <SheetTitle>Open Existing Tab</SheetTitle>
        </SheetHeader>
        <div v-if="openTabs?.length" class="space-y-2 mt-4">
          <div
            v-for="tab in openTabs"
            :key="tab.id"
            @click="selectTab(tab)"
            class="p-3 border rounded cursor-pointer hover:bg-muted"
          >
            <div class="font-medium">{{ tab.tab_number }}</div>
            <div class="text-sm text-muted-foreground">${{ tab.total_owed.toFixed(2) }}</div>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Add Item Sheet -->
    <Sheet v-model:open="showAddItemSheet">
      <SheetContent class="overflow-y-auto max-h-screen px-4">
        <SheetHeader>
          <SheetTitle>Add Item to Tab</SheetTitle>
        </SheetHeader>
        <form @submit="onAddItemSubmit" class="space-y-4 mt-4">
          <FormField v-slot="{ componentField }" name="menu_item_id">
            <FormItem>
              <FormLabel>Select Drink</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a drink" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    v-for="option in drinkOptions"
                    :key="option.value"
                    :value="String(option.value)"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="quantity">
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="unit_price">
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="special_instructions">
            <FormItem>
              <FormLabel>Special Instructions</FormLabel>
              <FormControl>
                <Textarea v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit">Add Item</Button>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const tabsStore = useTabsStore()
const drinksStore = useDrinksStore()
const authStore = useAuthStore()
const { profile } = storeToRefs(authStore)
const { tabs: openTabs, tab: currentTab, tabItems } = storeToRefs(tabsStore)
const { drinks } = storeToRefs(drinksStore)

const showNewTabSheet = ref(false)
const showOpenTabSheet = ref(false)
const showAddItemSheet = ref(false)

const generateTabNumber = () => {
  const timestamp = Date.now().toString().slice(-6)
  const randomBytes = new Uint32Array(1)
  crypto.getRandomValues(randomBytes)
  const random = ((randomBytes[0] ?? 0) % 1000).toString().padStart(3, '0')
  return `TAB-${timestamp}-${random}`
}

const drinkOptions = computed(
  () =>
    drinks.value?.map((drink) => ({
      label: `${drink.name} - $${drink.price?.toFixed(2) || '0.00'}`,
      value: drink.id,
    })) || [],
)

// New Tab Form
const newTabSchema = toTypedSchema(
  z.object({
    tab_number: z.string(),
    user_id: z.string(),
    special_notes: z.string().optional(),
  }),
)

const newTabForm = useForm({
  validationSchema: newTabSchema,
})

watch(showNewTabSheet, (val) => {
  if (val) {
    newTabForm.setValues({
      tab_number: generateTabNumber(),
      user_id: profile.value?.full_name || '',
      special_notes: '',
    })
  }
})

const onNewTabSubmit = newTabForm.handleSubmit(async (values) => {
  const tabId = await tabsStore.createTab({
    user_id: profile.value?.id || '', // Start with current user ID, though form shows full name. Logic adjustment needed?
    // Original code used profile?.id for user_id in createTab, but displayed full_name in form.
    // The form value here 'user_id' seems to be holding the NAME in the UI but we need ID for API.
    // Let's check original: :value="{ tab_number: ..., user_id: profile?.id || '' }"
    // And input: <FormKit ... :value="profile?.full_name" disabled />
    // Wait, FormKit :value on Form vs :value on Input.
    // The Original Input "user_id" had :value="profile?.full_name".
    // But the Form initial value had user_id: profile?.id.
    // If the input name is user_id, it would be overwritten by the input's value?
    // Actually, if the input is disabled, it might not submit?
    // Let's stick to using profile.value.id for the API call, ignoring what's visibly in the "user_id" field if it's just for display.

    // We should probably keep 'user_id' field as the ID if possible, or just use a separate display field.
    // For simplicity, let's assume the form `user_id` field holds the DISPLAY name, and we use profile.id for the API.

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
    await tabsStore.getTab(tabId.toString())
    showNewTabSheet.value = false
  }
})

// Add Item Form
const addItemSchema = toTypedSchema(
  z.object({
    menu_item_id: z.string().min(1, 'Select a drink'),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
    special_instructions: z.string().optional(),
  }),
)

const addItemForm = useForm({
  validationSchema: addItemSchema,
  initialValues: {
    quantity: 1,
    unit_price: 0,
  },
})

const onAddItemSubmit = addItemForm.handleSubmit(async (values) => {
  if (!currentTab.value) return

  const itemTotal = values.quantity * values.unit_price

  await tabsStore.addTabItem({
    tab_id: currentTab.value.id,
    menu_item_id: Number.parseInt(values.menu_item_id),
    quantity: values.quantity,
    unit_price: values.unit_price,
    item_total: itemTotal,
    special_instructions: values.special_instructions || null,
  })

  // Update tab totals
  const newSubtotal = currentTab.value.subtotal + itemTotal
  const newTotal =
    (newSubtotal || 0) + (currentTab.value?.tax_amount || 0) + (currentTab.value?.tip_amount || 0)

  await tabsStore.updateTab(currentTab.value.id, {
    subtotal: newSubtotal,
    total_before_tip: newSubtotal + currentTab.value.tax_amount,
    total_owed: newTotal,
  })

  showAddItemSheet.value = false
})

const selectTab = async (tab: Tabs[0]) => {
  await tabsStore.getTab(tab.id.toString())
  await tabsStore.getTabItems(tab.id.toString())
  showOpenTabSheet.value = false
}

// Load initial data
onMounted(async () => {
  await drinksStore.getDrinks()
  await tabsStore.getOpenTabs()
})
</script>
