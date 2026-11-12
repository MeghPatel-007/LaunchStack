// UI placeholder only — wire to API later.

export type ProjectStatus =
  | "Planning"
  | "In progress"
  | "In review"
  | "Completed"
  | "Archived"

export type TaskStatus =
  | "Backlog"
  | "To do"
  | "In progress"
  | "In review"
  | "Done"

export type TaskPriority = "Low" | "Medium" | "High" | "Critical"

export type PhaseStatus = "Planned" | "In progress" | "Completed"

export interface Member {
  id: string
  name: string
  email: string
  role: string
}

export interface Project {
  id: string
  name: string
  key: string
  description: string
  status: ProjectStatus
  progress: number
  accent: string
  memberIds: string[]
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string
  dueDate: string
}

export interface Phase {
  id: string
  projectId: string
  name: string
  description: string
  status: PhaseStatus
  progress: number
  startDate: string
  endDate: string
  taskCount: number
}

export interface Activity {
  id: string
  actorId: string
  action: string
  target: string
  projectId: string
  at: string
}

export const members: Member[] = [
  {
    id: "m1",
    name: "Alex Morgan",
    email: "alex@launchstack.dev",
    role: "Product Lead",
  },
  {
    id: "m2",
    name: "Priya Shah",
    email: "priya@launchstack.dev",
    role: "Frontend Engineer",
  },
  {
    id: "m3",
    name: "Daniel Kim",
    email: "daniel@launchstack.dev",
    role: "Backend Engineer",
  },
  {
    id: "m4",
    name: "Sofia Rossi",
    email: "sofia@launchstack.dev",
    role: "Product Designer",
  },
  {
    id: "m5",
    name: "Marcus Lee",
    email: "marcus@launchstack.dev",
    role: "QA Engineer",
  },
  {
    id: "m6",
    name: "Emma Walker",
    email: "emma@launchstack.dev",
    role: "Engineering Manager",
  },
]

export const projects: Project[] = [
  {
    id: "website-revamp",
    name: "Website Revamp",
    key: "WEB",
    description:
      "Marketing site refresh with a clearer story, faster pages and a stronger onboarding path.",
    status: "In progress",
    progress: 62,
    accent: "bg-info",
    memberIds: ["m1", "m2", "m4", "m6"],
    updatedAt: "2h ago",
  },
  {
    id: "mobile-app",
    name: "Mobile App v2",
    key: "APP",
    description:
      "A faster native companion app for tracking work, reviews and notifications on the go.",
    status: "Planning",
    progress: 24,
    accent: "bg-warning",
    memberIds: ["m1", "m3", "m4"],
    updatedAt: "5h ago",
  },
  {
    id: "design-system",
    name: "Design System",
    key: "DS",
    description:
      "Shared primitives, tokens and interaction patterns for every LaunchStack surface.",
    status: "In review",
    progress: 81,
    accent: "bg-success",
    memberIds: ["m4", "m2", "m6"],
    updatedAt: "Yesterday",
  },
  {
    id: "api-platform",
    name: "API Platform",
    key: "API",
    description:
      "Public API foundations, developer documentation and the tooling around them.",
    status: "Completed",
    progress: 100,
    accent: "bg-primary",
    memberIds: ["m3", "m1", "m6"],
    updatedAt: "3d ago",
  },
]

export const tasks: Task[] = [
  // Website Revamp
  { id: "TASK-201", projectId: "website-revamp", title: "Audit current marketing pages", status: "Done", priority: "Medium", assigneeId: "m2", dueDate: "Oct 18" },
  { id: "TASK-202", projectId: "website-revamp", title: "Rewrite homepage narrative", status: "Done", priority: "High", assigneeId: "m1", dueDate: "Oct 24" },
  { id: "TASK-203", projectId: "website-revamp", title: "Rebuild pricing section", status: "In progress", priority: "High", assigneeId: "m2", dueDate: "Nov 14" },
  { id: "TASK-204", projectId: "website-revamp", title: "Design feature comparison table", status: "In progress", priority: "Medium", assigneeId: "m4", dueDate: "Nov 15" },
  { id: "TASK-205", projectId: "website-revamp", title: "Migrate customer stories", status: "In review", priority: "Medium", assigneeId: "m1", dueDate: "Nov 16" },
  { id: "TASK-206", projectId: "website-revamp", title: "Polish mobile navigation", status: "To do", priority: "High", assigneeId: "m2", dueDate: "Nov 20" },
  { id: "TASK-207", projectId: "website-revamp", title: "Add analytics events", status: "To do", priority: "Low", assigneeId: "m3", dueDate: "Nov 22" },
  { id: "TASK-208", projectId: "website-revamp", title: "Accessibility pass on forms", status: "Backlog", priority: "High", assigneeId: "m5", dueDate: "Dec 02" },
  { id: "TASK-209", projectId: "website-revamp", title: "Refresh OG images", status: "Backlog", priority: "Low", assigneeId: "m4", dueDate: "Dec 04" },
  { id: "TASK-210", projectId: "website-revamp", title: "Set up visual regression checks", status: "Backlog", priority: "Medium", assigneeId: "m5", dueDate: "Dec 06" },

  // Mobile App v2
  { id: "TASK-301", projectId: "mobile-app", title: "Interview active mobile users", status: "Done", priority: "High", assigneeId: "m1", dueDate: "Oct 30" },
  { id: "TASK-302", projectId: "mobile-app", title: "Prototype offline task queue", status: "In progress", priority: "Critical", assigneeId: "m3", dueDate: "Nov 18" },
  { id: "TASK-303", projectId: "mobile-app", title: "Design notification center", status: "In progress", priority: "Medium", assigneeId: "m4", dueDate: "Nov 21" },
  { id: "TASK-304", projectId: "mobile-app", title: "Define beta rollout plan", status: "To do", priority: "Medium", assigneeId: "m1", dueDate: "Nov 25" },
  { id: "TASK-305", projectId: "mobile-app", title: "Crash reporting integration", status: "Backlog", priority: "Low", assigneeId: "m3", dueDate: "Dec 08" },

  // Design System
  { id: "TASK-401", projectId: "design-system", title: "Publish spacing and radius tokens", status: "Done", priority: "Medium", assigneeId: "m4", dueDate: "Oct 12" },
  { id: "TASK-402", projectId: "design-system", title: "Finalize data table patterns", status: "In review", priority: "High", assigneeId: "m2", dueDate: "Nov 13" },
  { id: "TASK-403", projectId: "design-system", title: "Document empty and error states", status: "In progress", priority: "Medium", assigneeId: "m4", dueDate: "Nov 19" },
  { id: "TASK-404", projectId: "design-system", title: "Dark mode contrast audit", status: "To do", priority: "High", assigneeId: "m6", dueDate: "Nov 27" },

  // API Platform
  { id: "TASK-501", projectId: "api-platform", title: "Ship v1 REST endpoints", status: "Done", priority: "High", assigneeId: "m3", dueDate: "Sep 28" },
  { id: "TASK-502", projectId: "api-platform", title: "Publish authentication guide", status: "Done", priority: "Medium", assigneeId: "m1", dueDate: "Oct 06" },
  { id: "TASK-503", projectId: "api-platform", title: "Add rate limit documentation", status: "Done", priority: "Low", assigneeId: "m6", dueDate: "Oct 20" },
]

export const phases: Phase[] = [
  { id: "phase-1", projectId: "website-revamp", name: "Discovery", description: "Audit existing pages and agree on the new narrative.", status: "Completed", progress: 100, startDate: "Sep 30", endDate: "Oct 11", taskCount: 2 },
  { id: "phase-2", projectId: "website-revamp", name: "Design", description: "Wireframes, visual direction and responsive layouts.", status: "Completed", progress: 100, startDate: "Oct 14", endDate: "Oct 28", taskCount: 3 },
  { id: "phase-3", projectId: "website-revamp", name: "Build", description: "Implement sections, migrate content and wire analytics.", status: "In progress", progress: 54, startDate: "Oct 29", endDate: "Nov 22", taskCount: 4 },
  { id: "phase-4", projectId: "website-revamp", name: "Launch", description: "QA, accessibility review and go-live checks.", status: "Planned", progress: 0, startDate: "Nov 25", endDate: "Dec 06", taskCount: 1 },
  { id: "phase-5", projectId: "mobile-app", name: "Research", description: "Understand current mobile usage and drop-off points.", status: "Completed", progress: 100, startDate: "Oct 07", endDate: "Oct 30", taskCount: 1 },
  { id: "phase-6", projectId: "mobile-app", name: "Prototype", description: "Validate the offline queue and notification model.", status: "In progress", progress: 38, startDate: "Nov 03", endDate: "Nov 28", taskCount: 2 },
  { id: "phase-7", projectId: "mobile-app", name: "Beta", description: "Ship to internal users and collect crash reports.", status: "Planned", progress: 0, startDate: "Dec 01", endDate: "Dec 19", taskCount: 2 },
  { id: "phase-8", projectId: "design-system", name: "Foundation", description: "Tokens, typography and foundational primitives.", status: "Completed", progress: 100, startDate: "Sep 08", endDate: "Oct 11", taskCount: 1 },
  { id: "phase-9", projectId: "design-system", name: "Components", description: "Data tables, forms and feedback patterns.", status: "In progress", progress: 76, startDate: "Oct 14", endDate: "Nov 21", taskCount: 2 },
  { id: "phase-10", projectId: "design-system", name: "Documentation", description: "Usage guidance and contribution rules.", status: "Planned", progress: 0, startDate: "Nov 24", endDate: "Dec 12", taskCount: 1 },
  { id: "phase-11", projectId: "api-platform", name: "Design", description: "Endpoint contracts and error model.", status: "Completed", progress: 100, startDate: "Aug 05", endDate: "Aug 29", taskCount: 1 },
  { id: "phase-12", projectId: "api-platform", name: "Build", description: "Implement and harden the public API.", status: "Completed", progress: 100, startDate: "Sep 01", endDate: "Sep 28", taskCount: 1 },
  { id: "phase-13", projectId: "api-platform", name: "Documentation", description: "Authentication, rate limits and examples.", status: "Completed", progress: 100, startDate: "Oct 01", endDate: "Oct 20", taskCount: 1 },
]

export const activities: Activity[] = [
  { id: "a1", actorId: "m2", action: "moved", target: "Rebuild pricing section", projectId: "website-revamp", at: "12 minutes ago" },
  { id: "a2", actorId: "m3", action: "commented on", target: "API rate limits", projectId: "api-platform", at: "48 minutes ago" },
  { id: "a3", actorId: "m4", action: "attached", target: "Homepage wireframes", projectId: "website-revamp", at: "2 hours ago" },
  { id: "a4", actorId: "m1", action: "created", target: "Define beta rollout plan", projectId: "mobile-app", at: "3 hours ago" },
  { id: "a5", actorId: "m6", action: "reviewed", target: "Data table patterns", projectId: "design-system", at: "5 hours ago" },
  { id: "a6", actorId: "m5", action: "completed", target: "Accessibility pass on forms", projectId: "website-revamp", at: "Yesterday" },
  { id: "a7", actorId: "m3", action: "closed", target: "Ship v1 REST endpoints", projectId: "api-platform", at: "Yesterday" },
  { id: "a8", actorId: "m4", action: "updated", target: "Notification center spec", projectId: "mobile-app", at: "2 days ago" },
]

export function getProject(projectId: string) {
  return projects.find((project) => project.id === projectId)
}

export function getMember(memberId: string) {
  return members.find((member) => member.id === memberId)
}

export function getProjectMembers(project: Project) {
  return project.memberIds
    .map((memberId) => getMember(memberId))
    .filter((member): member is Member => Boolean(member))
}

export function getProjectTasks(projectId: string) {
  return tasks.filter((task) => task.projectId === projectId)
}

export function getProjectPhases(projectId: string) {
  return phases.filter((phase) => phase.projectId === projectId)
}

export function getProjectActivities(projectId: string) {
  return activities.filter((activity) => activity.projectId === projectId)
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
