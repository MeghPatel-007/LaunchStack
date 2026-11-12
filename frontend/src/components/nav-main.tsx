"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  label,
  items,
}: {
  label: string
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    disabled?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <NavItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavItem({
  item,
}: {
  item: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    disabled?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }
}) {
  const pathname = usePathname()
  const active = item.isActive ?? pathname === item.url

  // Evaluated once so the uncontrolled Collapsible never sees its default
  // open state change after mount (which Base UI warns about). Active
  // styling still comes from `isActive` on the button below.
  const [defaultOpen] = React.useState(() =>
    item.items?.some((subItem) => pathname === subItem.url) ?? false
  )

  if (item.items?.length) {
    return (
      <Collapsible
        defaultOpen={defaultOpen}
        className="group/collapsible"
        render={<SidebarMenuItem />}
      >
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              tooltip={item.title}
              className="cursor-pointer"
            />
          }
        >
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  className="cursor-pointer"
                  isActive={pathname === subItem.url}
                  render={<Link href={subItem.url} />}
                >
                  <span>{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  if (item.disabled) {
    return (
      <>
        <SidebarMenuButton disabled tooltip={item.title}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </SidebarMenuButton>
        <SidebarMenuBadge>Soon</SidebarMenuBadge>
      </>
    )
  }

  return (
    <SidebarMenuButton
      tooltip={item.title}
      className="cursor-pointer"
      isActive={active}
      render={<Link href={item.url} />}
    >
      {item.icon && <item.icon />}
      <span>{item.title}</span>
    </SidebarMenuButton>
  )
}
