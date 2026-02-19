import type { ColumnDef } from '@tanstack/vue-table'
import type { Drinks } from '@/services/supabase/types/drinkTypes'
import { RouterLink } from 'vue-router'
import { h } from 'vue'
import { formatCurrency } from '@/utils/currency'

export const columns: ColumnDef<Drinks[0]>[] = [
  {
    accessorKey: 'id',
    header: () => h('div', { class: 'text-left' }, 'ID'),
    cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('id'))
  },
  {
    accessorKey: 'name',
    header: () => h('div', { class: 'text-left' }, 'Name'),
    cell: ({ row }) => {
      const slug = row.getValue('slug')
      return h(
        RouterLink,
        {
          to: `/drinks/${slug}`,
          class: 'text-left font-medium hover:bg-muted block w-full'
        },
        () => row.getValue('name')
      )
    }
  },
  {
    accessorKey: 'slug',
    header: () => h('div', { class: 'text-left' }, 'Slug'),
    cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('slug'))
  },
  {
    accessorKey: 'category',
    header: () => h('div', { class: 'text-left' }, 'Category'),
    cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('category'))
  },
  {
    accessorKey: 'alcoholic',
    header: () => h('div', { class: 'text-left' }, 'Alcoholic'),
    cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('alcoholic'))
  },
  {
    accessorKey: 'glass',
    header: () => h('div', { class: 'text-left' }, 'Glass'),
    cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('glass'))
  },
  {
    accessorKey: 'active',
    header: () => h('div', { class: 'text-left' }, 'Active'),
    cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('active'))
  },
  {
    accessorKey: 'price',
    header: () => h('div', { class: 'text-left' }, 'Price'),
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue('price'))
      const formatted = formatCurrency(amount)
      return h('div', { class: 'text-right font-medium' }, formatted)
    },
  },
  {
    accessorKey: 'instructions',
    header: () => h('div', { class: 'text-left' }, 'Instructions'),
    cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('instructions'))
  },
  {
    accessorKey: 'thumb_url',
    header: () => h('div', { class: 'text-left' }, 'Thumbnail'),
    cell: ({ row }) => h('img', { src: row.getValue('thumb_url'), class: 'h-10 w-10 object-cover' })
  },
  {
    accessorKey: 'measurements',
    header: () => h('div', { class: 'text-left' }, 'Measurements'),
    cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('measurements'))
  },
  {
    accessorKey: 'ingredients',
    header: () => h('div', { class: 'text-left' }, 'Ingredients'),
    cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('ingredients'))
  },
  {
    accessorKey: 'last_modified',
    header: () => h('div', { class: 'text-left' }, 'Last Modified'),
    cell: ({ row }) => h('div', { class: 'text-left' }, row.getValue('last_modified'))
  }
]
