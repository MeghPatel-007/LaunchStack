import { Mail } from "@/app/dashboard/[id]/mail/components/mail"
import { accounts, mails } from "@/app/dashboard/[id]/mail/data"

export default function MailPage() {
  return <Mail accounts={accounts} mails={mails} navCollapsedSize={4} />
}
