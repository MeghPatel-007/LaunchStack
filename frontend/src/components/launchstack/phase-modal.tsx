
'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
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
  Phase,
  PhaseStatus,
  CreatePhaseInput,
} from '@/types/phase'

const phaseStatuses = [
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
] as const

const phaseSchema = z.object({
  name: z.string().trim().min(1, 'Phase name is required'),
  description: z.string(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  position: z.number().int().min(1, 'Position must be at least 1'),
  start_time: z.string(),
  finished_time: z.string(),
}).superRefine((data, ctx) => {
  if (data.status === 'NOT_STARTED') {
    if (data.start_time || data.finished_time) {
      ctx.addIssue({
        code: 'custom',
        message: 'Not started phases cannot have dates.',
        path: ['status'],
      })
    }
  }

  if (data.status === 'IN_PROGRESS') {
    if (!data.start_time) {
      ctx.addIssue({
        code: 'custom',
        message: 'Start date is required for an in-progress phase.',
        path: ['start_time'],
      })
    }

    if (data.finished_time) {
      ctx.addIssue({
        code: 'custom',
        message: 'An in-progress phase cannot have a finished date.',
        path: ['finished_time'],
      })
    }
  }

  if (data.status === 'COMPLETED') {
    if (!data.start_time) {
      ctx.addIssue({
        code: 'custom',
        message: 'Start date is required.',
        path: ['start_time'],
      })
    }

    if (!data.finished_time) {
      ctx.addIssue({
        code: 'custom',
        message: 'Finished date is required.',
        path: ['finished_time'],
      })
    }

    if (
      data.start_time &&
      data.finished_time &&
      new Date(data.finished_time) < new Date(data.start_time)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Finished date cannot be before start date.',
        path: ['finished_time'],
      })
    }
  }
})

type PhaseFormData = {
  name: string
  description: string
  status: PhaseStatus
  position: number
  start_time: string
  finished_time: string
}

interface PhaseModalProps {
  onAddPhase?: (data: CreatePhaseInput) => Promise<void>
  onUpdatePhase?: (data: CreatePhaseInput) => Promise<void>
  phase?: Phase
  nextPosition: number
  trigger?: ReactElement
}

function toDateInput(value: string | null): string {
  if (!value) return ''

  return value.slice(0, 10)
}

export function PhaseModal({
  onAddPhase,
  onUpdatePhase,
  phase,
  nextPosition,
  trigger,
}: PhaseModalProps) {
  const isEditing = Boolean(phase)

  const getInitialData = (): PhaseFormData => ({
    name: phase?.name ?? '',
    description: phase?.description ?? '',
    status: phase?.status ?? 'NOT_STARTED',
    position: phase?.position ?? nextPosition,
    start_time: toDateInput(phase?.start_time ?? null),
    finished_time: toDateInput(phase?.finished_time ?? null),
  })

  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<PhaseFormData>(getInitialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync form fields when the dialog opens, without an effect.
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setFormData(getInitialData())
      setErrors({})
      setSubmitError('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) return

    setErrors({})
    setSubmitError('')

    const result = phaseSchema.safeParse(formData)

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

    const payload: CreatePhaseInput = {
      name: result.data.name,
      description: result.data.description.trim() || null,
      status: result.data.status,
      position: result.data.position,
      start_time: result.data.start_time
        ? new Date(`${result.data.start_time}T00:00:00`).toISOString()
        : null,
      finished_time: result.data.finished_time
        ? new Date(`${result.data.finished_time}T00:00:00`).toISOString()
        : null,
    }

    try {
      setIsSubmitting(true)

      if (phase) {
        if (!onUpdatePhase) {
          throw new Error('Update handler is not configured.')
        }

        await onUpdatePhase(payload)
      } else {
        if (!onAddPhase) {
          throw new Error('Create handler is not configured.')
        }

        await onAddPhase(payload)
      }

      setOpen(false)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to save phase.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) setOpen(nextOpen)
      }}
    >
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger
          render={
            <Button size="sm">
              <Plus data-icon="inline-start" />
              Add Phase
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Phase' : 'Add Phase'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this project phase.'
              : 'Create a new phase for this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="phase-name">Phase name *</FieldLabel>
              <Input
                id="phase-name"
                value={formData.name}
                disabled={isSubmitting}
                placeholder="e.g. Planning"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="phase-description">Description</FieldLabel>
              <Textarea
                id="phase-description"
                value={formData.description}
                disabled={isSubmitting}
                placeholder="Describe this phase..."
                rows={3}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Field>
          </FieldGroup>

          <FieldGroup className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Position *</FieldLabel>
              <Input
                type="number"
                min={1}
                value={formData.position}
                disabled={isSubmitting}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    position: Number(e.target.value),
                  }))
                }
              />
              {errors.position && (
                <p className="text-sm text-destructive">{errors.position}</p>
              )}
            </Field>

            <Field>
              <FieldLabel>Status *</FieldLabel>
              <Select
                items={phaseStatuses}
                value={formData.status}
                disabled={isSubmitting}
                onValueChange={(value) => {
                  if (value) {
                    setFormData((prev) => ({
                      ...prev,
                      status: value as PhaseStatus,
                      start_time:
                        value === 'NOT_STARTED' ? '' : prev.start_time,
                      finished_time:
                        value === 'COMPLETED'
                          ? prev.finished_time
                          : '',
                    }))
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {phaseStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </Field>
          </FieldGroup>

          {formData.status !== 'NOT_STARTED' && (
            <Field>
              <FieldLabel htmlFor="phase-start">Start date *</FieldLabel>
              <Input
                id="phase-start"
                type="date"
                value={formData.start_time}
                disabled={isSubmitting}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
              />
              {errors.start_time && (
                <p className="text-sm text-destructive">
                  {errors.start_time}
                </p>
              )}
            </Field>
          )}

          {formData.status === 'COMPLETED' && (
            <Field>
              <FieldLabel htmlFor="phase-finished">Finished date *</FieldLabel>
              <Input
                id="phase-finished"
                type="date"
                value={formData.finished_time}
                disabled={isSubmitting}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    finished_time: e.target.value,
                  }))
                }
              />
              {errors.finished_time && (
                <p className="text-sm text-destructive">
                  {errors.finished_time}
                </p>
              )}
            </Field>
          )}

          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? (
                <Pencil data-icon="inline-start" />
              ) : (
                <Plus data-icon="inline-start" />
              )}
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Update Phase'
                  : 'Add Phase'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
