"use client"

import * as React from "react"
import {
  Activity,
  ArrowLeft,
  CheckSquare,
  Columns3,
  Flag,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  ListTodo,
  Settings,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Logo } from "@/components/logo"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { getProject, projects } from "@/data/launchstack"

const user = {
  name: "Alex Morgan",
  email: "alex@launchstack.dev",
  avatar: "",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const base = `/dashboard/${id}`

  const projectMatch = pathname.match(
    /\/dashboard\/[^/]+\/projects\/([^/]+)/
  )
  const project = projectMatch ? getProject(projectMatch[1]) : undefined

  const workspaceItems = [
    {
      title: "Overview",
      url: base,
      icon: LayoutDashboard,
      isActive: pathname === base,
    },
    {
      title: "My Work",
      url: `${base}/tasks`,
      icon: CheckSquare,
      isActive: pathname.startsWith(`${base}/tasks`),
    },
    {
      title: "Projects",
      url: `${base}/projects`,
      icon: FolderKanban,
      isActive: pathname.startsWith(`${base}/projects`),
    },
    {
      title: "Members",
      url: `${base}/members`,
      icon: Users,
      isActive: pathname.startsWith(`${base}/members`),
    },
    {
      title: "Activity",
      url: `${base}/activity`,
      icon: Activity,
      isActive: pathname.startsWith(`${base}/activity`),
    },
  ]

  const projectItems = project
    ? [
        {
          title: "Overview",
          url: `${base}/projects/${project.id}`,
          icon: LayoutDashboard,
          isActive: pathname === `${base}/projects/${project.id}`,
        },
        {
          title: "Backlog",
          url: `${base}/projects/${project.id}/backlog`,
          icon: ListTodo,
          isActive: pathname.startsWith(
            `${base}/projects/${project.id}/backlog`
          ),
        },
        {
          title: "Board",
          url: `${base}/projects/${project.id}/board`,
          icon: Columns3,
          isActive: pathname.startsWith(`${base}/projects/${project.id}/board`),
        },
        {
          title: "Phases",
          url: `${base}/projects/${project.id}/phases`,
          icon: Flag,
          isActive: pathname.startsWith(`${base}/projects/${project.id}/phases`),
        },
        {
          title: "Members",
          url: `${base}/projects/${project.id}/members`,
          icon: Users,
          isActive: pathname.startsWith(
            `${base}/projects/${project.id}/members`
          ),
        },
        {
          title: "Activity",
          url: `${base}/projects/${project.id}/activity`,
          icon: Activity,
          isActive: pathname.startsWith(
            `${base}/projects/${project.id}/activity`
          ),
        },
        {
          title: "Project settings",
          url: `${base}/projects/${project.id}/settings`,
          icon: Settings,
          isActive: pathname.startsWith(
            `${base}/projects/${project.id}/settings`
          ),
        },
      ]
    : []

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {project ? (
              <SidebarMenuButton
                size="lg"
                tooltip={project.name}
                render={
                  <Link href={`${base}/projects/${project.id}`} />
                }
              >
                <div
                  className={cn(
                    "flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-semibold text-white",
                    project.accent
                  )}
                >
                  {project.key}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{project.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {project.status} · {project.key}
                  </span>
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                size="lg"
                tooltip="LaunchStack"
                render={<Link href={base} />}
              >
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">LaunchStack</span>
                  <span className="text-muted-foreground truncate text-xs">
                    Acme workspace
                  </span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {project ? (
          <>
            <NavMain label="Project" items={projectItems} />
            <NavMain
              label=""
              items={[
                {
                  title: "Back to workspace",
                  url: base,
                  icon: ArrowLeft,
                },
              ]}
            />
          </>
        ) : (
          <>
            <NavMain label="Workspace" items={workspaceItems} />
            <SidebarGroup>
              <SidebarGroupLabel>Recent projects</SidebarGroupLabel>
              <SidebarMenu>
                {projects.slice(0, 3).map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.name}
                      isActive={
                        pathname === `${base}/projects/${item.id}` ||
                        pathname.startsWith(`${base}/projects/${item.id}/`)
                      }
                      render={
                        <Link href={`${base}/projects/${item.id}`} />
                      }
                    >
                      <span
                        className={cn("size-2 rounded-full", item.accent)}
                      />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <NavMain
              label=""
              items={[
                {
                  title: "Settings",
                  url: `${base}/settings/account`,
                  icon: Settings,
                  isActive: pathname.startsWith(`${base}/settings`),
                },
                {
                  title: "Help",
                  url: "",
                  icon: HelpCircle,
                  disabled: true,
                },
              ]}
            />
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} base={base} />
      </SidebarFooter>
    </Sidebar>
  )
}
