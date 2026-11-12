import Link from 'next/link'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string; projectId: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-muted/30 border-b">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 md:px-6">
          <nav className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <Link
              href={`/dashboard/${id}/projects`}
              className="hover:text-foreground"
            >
              Projects
            </Link>
            <span>/</span>
            <span className="text-foreground">Project overview</span>
          </nav>
        </div>
      </div>

      {children}
    </div>
  )
}
