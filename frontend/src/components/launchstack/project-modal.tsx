'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { z } from 'zod'

import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectType,
} from '@/types/project'

const projectTypes = [
  { value: 'web', label: 'Web application' },
  { value: 'mobile', label: 'Mobile application' },
  { value: 'api', label: 'API / backend' },
  { value: 'design', label: 'Design system' },
] as const

const techStacks = [
  { value: 'react', label: 'React' },
  { value: 'nextjs', label: 'Next.js' },
  { value: 'node', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
] as const

const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().optional(),
  projectType: z.enum(['web', 'mobile', 'api', 'design']),
  techStack: z.string().min(1, 'Select a tech stack'),
})

type ProjectFormData = z.infer<typeof projectFormSchema>

interface AddProjectModalProps {
  onAddProject?: (data: CreateProjectInput) => Promise<void>
  onUpdateProject?: (data: UpdateProjectInput) => Promise<void>
  project?: Project
  trigger?: ReactElement
}

const initialFormData: ProjectFormData = {
  name: '',
  description: '',
  projectType: projectTypes[0].value,
  techStack: techStacks[0].value,
}

export function AddProjectModal({
  onAddProject,
  onUpdateProject,
  project,
  trigger,
}: AddProjectModalProps) {
  const isEditing = Boolean(project)

  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync form fields when the dialog opens, without an effect.
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setFormData(
        project
          ? {
              name: project.name,
              description: project.description ?? '',
              projectType: project.project_type as ProjectType,
              techStack: project.tech_stack ?? '',
            }
          : { ...initialFormData },
      )
      setErrors({})
      setSubmitError('')
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isSubmitting) return

    setErrors({})
    setSubmitError('')

    const result = projectFormSchema.safeParse(formData)

    if (!result.success) {
      const newErrors: Record<string, string> = {}

      result.error.issues.forEach((issue) => {
        const field = issue.path[0]

        if (field) {
          newErrors[String(field)] = issue.message
        }
      })

      setErrors(newErrors)
      return
    }

    const payload = {
      name: result.data.name,
      description: result.data.description?.trim() || null,
      project_type: result.data.projectType as ProjectType,
      tech_stack: result.data.techStack,
    }

    try {
      setIsSubmitting(true)

      if (project) {
        if (!onUpdateProject) {
          throw new Error('Update handler is not configured.')
        }

        await onUpdateProject(payload)
      } else {
        if (!onAddProject) {
          throw new Error('Create handler is not configured.')
        }

        await onAddProject(payload)
      }

      setFormData({ ...initialFormData })
      setErrors({})
      setSubmitError('')
      setOpen(false)
    } catch (error) {
      console.error('Failed to save project:', error)

      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the project.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isSubmitting) return

    setFormData({ ...initialFormData })
    setErrors({})
    setSubmitError('')
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return
        setOpen(nextOpen)
      }}
    >
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger
          render={
            <Button variant="default" size="sm" className="cursor-pointer">
              <Plus data-icon="inline-start" />
              Create Project
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? 'Update your project details.'
              : 'Start a new project to organize work and track progress.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Project Name *</FieldLabel>
              <Input
                id="name"
                placeholder="Enter project name..."
                value={formData.name}
                disabled={isSubmitting}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="What is this project about?"
                value={formData.description ?? ''}
                disabled={isSubmitting}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </Field>
          </FieldGroup>

          <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="projectType">Project Type</FieldLabel>
              <Select
                items={projectTypes}
                value={formData.projectType}
                disabled={isSubmitting}
                onValueChange={(value) => {
                  if (value) {
                    setFormData((prev) => ({
                      ...prev,
                      projectType: value as ProjectType,
                    }))
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {projectTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.projectType && (
                <p className="text-sm text-destructive">{errors.projectType}</p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="techStack">Tech Stack</FieldLabel>
              <Select
                items={techStacks}
                value={formData.techStack}
                disabled={isSubmitting}
                onValueChange={(value) => {
                  if (value) {
                    setFormData((prev) => ({
                      ...prev,
                      techStack: value,
                    }))
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tech stack" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {techStacks.map((stack) => (
                      <SelectItem key={stack.value} value={stack.value}>
                        {stack.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.techStack && (
                <p className="text-sm text-destructive">{errors.techStack}</p>
              )}
            </Field>
          </FieldGroup>

          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isEditing ? (
                <Pencil data-icon="inline-start" />
              ) : (
                <Plus data-icon="inline-start" />
              )}

              {isSubmitting
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Project'
                  : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
