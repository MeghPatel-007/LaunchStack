import { Calendar } from "@/app/dashboard/[id]/calendar/components/calendar"
import { events, eventDates } from "@/app/dashboard/[id]/calendar/data"

export default function CalendarPage() {
  return (
    <div className="px-4 lg:px-6">
      <Calendar events={events} eventDates={eventDates} />
    </div>
  )
}
