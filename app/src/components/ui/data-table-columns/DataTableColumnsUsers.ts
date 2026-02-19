import { RouterLink } from 'vue-router'
import DropdownAction from '@/components/ui/data-table-drop-down/DataTableDropDown.vue'
import type { ColumnDef } from '@tanstack/vue-table'
import type { DeleteUser } from '@/interfaces/UserInterfaces'
import type { Profiles } from '@/services/supabase/types/profileTypes'
import profileApi from '@/services/api/profileApi'

const { deleteProfile } = profileApi
// const profileStore = useUsersStore();



// const updateUser = ref()

export const columns: ColumnDef<Profiles[0]>[] = [
  {
    accessorKey: 'username',
    header: () => h('div', { class: 'text-left' }, 'Name'),
    cell: ({ row }) => {
      const username = row.original.username
      return h(
        RouterLink,
        {
          to: `/users/${username}`,
          class: 'text-left font-medium hover:bg-muted block w-full',
        },
        () => username,
      )
    },
  },
  {
    accessorKey: 'user_role',
    header: () => h('div', { class: 'text-left' }, 'Role'),
    cell: ({ row }) => {
      const role = row.original.user_role
      return h('div', { class: 'text-left' }, role)
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-left' }, 'Actions'),
    enableHiding: false,
    cell: ({ row, table }) => {
      const user = row.original

      console.log(JSON.stringify(user))

      return h(
        'div',
        { class: 'relative' },
        h(DropdownAction, {
          object: {
            id: user.id,
            name: user.username,
            editFn: () => {
                 // @ts-ignore
                 // eslint-disable-next-line
                 table.options.meta?.onEditUser?.(user)
            },
            deleteFn: () => deleteProfile({"id": user?.id} as DeleteUser),
          },
        }),
      )
    },
  },
]
