<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const drinkSheetStore = useDrinkSheetStore()
const { isOpen, drinkId } = storeToRefs(drinkSheetStore)
const { closeSheet } = drinkSheetStore

const store = useDrinksStore()
const { getDrinks, getDrink } = store
const { drinks, drink } = storeToRefs(store)

// Reactively find the drink in the store to ensure we have the latest version
const drinkToEdit = computed(() => {
  if (!drinkId.value) return null
  const fromList = drinks.value?.find((d) => String(d.id) === String(drinkId.value))
  if (fromList) return fromList
  if (drink.value && String(drink.value.id) === String(drinkId.value)) {
    return drink.value
  }
  return null
})

// Fetch drink if we don't have it
watch(
  () => drinkId.value,
  async (newId) => {
    if (newId && !drinkToEdit.value) {
      await getDrink(String(newId))
    } else if (newId) {
      getDrink(String(newId))
    }
  },
  { immediate: true },
)

const isEditing = computed(() => !!drinkId.value)

const selectOptions = {
  alcoholic: [
    { label: 'Alcoholic', value: 'true' },
    { label: 'Non-Alcoholic', value: 'false' },
  ],
}

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    category: z.string().min(1).max(100),
    alcoholic: z.enum(['true', 'false']),
    glass: z.string().max(100).optional(),
    instructions: z.string().max(1000).optional(),
    thumb_url: z.string().url(),
    ingredients: z.string().max(1000).optional(),
    measurements: z.string().max(1000).optional(),
    price: z.number().min(0).optional(),
  }),
)

const form = useForm({
  validationSchema: formSchema,
})

// Watch for drinkToEdit changes to populate form
watch(
  () => drinkToEdit.value,
  (newDrink) => {
    if (newDrink) {
      form.setValues({
        name: newDrink.name,
        slug: newDrink.slug,
        category: newDrink.category.name,
        // Convert boolean to string for Select component
        alcoholic: newDrink.alcoholic ? 'true' : 'false',
        glass: newDrink.glass || '',
        instructions: (() => {
          const raw = newDrink.instructions || ''
          if (raw.trim().startsWith('[')) {
            try {
              const parsed = JSON.parse(raw)
              if (Array.isArray(parsed)) return parsed.join('\n')
            } catch {
              /* ignore */
            }
          }
          return raw
        })(),
        thumb_url: newDrink.thumb_url,
        ingredients: (newDrink.ingredients || []).join(', '),
        measurements: (newDrink.measurements || []).join(', '),
        price: newDrink.price || 0,
      })
    } else {
      form.resetForm()
      // Default values for new drink if helpful
      form.setFieldValue('alcoholic', 'true')
    }
  },
  { immediate: true },
)

const onSubmit = form.handleSubmit(async (values) => {
  const drinkData = {
    ...values,
    alcoholic: values.alcoholic === 'true',
    measurements: values.measurements
      ? String(values.measurements)
          .split(',')
          .map((m: string) => m.trim())
      : [],
    ingredients: values.ingredients
      ? String(values.ingredients)
          .split(',')
          .map((i: string) => i.trim())
      : [],
    active: true,
    last_modified: new Date(),
  }

  try {
    if (isEditing.value && drinkId.value) {
      const editPayload: EditDrink = {
        id: drinkId.value,
        data: drinkData,
      }
      await drinkApi.editDrink(editPayload)
      await getDrinks()
    } else {
      await drinkApi.createDrink(drinkData as unknown as CreateNewDrink)
      await getDrinks()
    }
    closeSheet()
  } catch (error) {
    console.error('Error saving drink:', error)
  }
})
</script>

<template>
  <Sheet :open="isOpen" @update:open="(v) => !v && closeSheet()">
    <SheetContent class="overflow-y-auto max-h-screen px-4">
      <SheetHeader>
        <SheetTitle>{{ isEditing ? 'Edit Drink' : 'Create New Drink' }}</SheetTitle>
        <SheetDescription>
          {{
            isEditing ? 'Make changes to the drink details below.' : 'Add a new drink to the menu.'
          }}
        </SheetDescription>
      </SheetHeader>

      <div v-if="isEditing && !drinkToEdit" class="flex justify-center items-center py-10">
        <iconify-icon
          icon="lucide:loader-circle"
          class="text-4xl animate-spin text-muted-foreground"
        />
      </div>

      <form v-else @submit="onSubmit" class="space-y-4 mt-6">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Drink Name</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter drink name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="slug">
          <FormItem>
            <FormLabel>Slug</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="url-friendly-name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="category">
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter category" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="alcoholic">
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem
                  v-for="option in selectOptions.alcoholic"
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

        <FormField v-slot="{ componentField }" name="glass">
          <FormItem>
            <FormLabel>Glass Type</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="e.g., Cocktail Glass" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="instructions">
          <FormItem>
            <FormLabel>Instructions</FormLabel>
            <FormControl>
              <Textarea v-bind="componentField" placeholder="Enter preparation instructions" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="thumb_url">
          <FormItem>
            <FormLabel>Image URL</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter image URL" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="ingredients">
          <FormItem>
            <FormLabel>Ingredients (comma-separated)</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter ingredients separated by commas" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="measurements">
          <FormItem>
            <FormLabel>Measurements (comma-separated)</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter measurements separated by commas" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="price">
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input
                v-bind="componentField"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter price"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <Button type="submit">{{ isEditing ? 'Save Changes' : 'Create Drink' }}</Button>
      </form>
    </SheetContent>
  </Sheet>
</template>
