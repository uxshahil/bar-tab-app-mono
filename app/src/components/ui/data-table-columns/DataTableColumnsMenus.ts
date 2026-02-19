import type { ColumnDef } from '@tanstack/vue-table'
import type { MenusWithCategories } from '@/services/supabase/types/menuTypes'
import { RouterLink } from 'vue-router'

export const columns: ColumnDef<MenusWithCategories[0]>[] = [
  {
    accessorKey: 'name',
    header: () => h('div', { class: 'text-left' }, 'Name'),
    cell: ({ row }) => {
      const slug = row.original.slug
      return h(
        RouterLink,
        {
          to: `/menu/${slug}`,
          class: 'text-left font-medium hover:bg-muted block w-full'
        },
        () => row.getValue('name')
      )
    }
  },
  {
    accessorKey: 'menu_item_category',
    header: () => h('div', { class: 'text-left' }, 'Categories'),
    cell: ({ row }) => {
      const categories = row.getValue('menu_item_category') as {
        id: string
        slug: string
        name: string
      }[]

      if (!categories || categories.length === 0) {
        return h('div', { class: 'text-left text-gray-500' }, 'No categories')
      }

      return h(
        'div',
        { class: 'text-left flex flex-wrap gap-2' },
        categories.map(category => {
          const slug = category?.slug
          return h(
            RouterLink,
            {
              to: `/menus/${row.original.slug}/${slug.toLowerCase().replace(/\s+/g, '-')}`,
              class: `text-left`
            },
            () => category.name
          )
        })
      )
    }
  }
]
