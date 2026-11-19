import { useEffect, useState } from "react"
import { api, type AuditEvent } from "@/lib/api"
import { ActivityList } from "@/components/ActivityList"
import { Card } from "@/components/ui"

export function ActivityPage() {
  const [events, setEvents] = useState<AuditEvent[] | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.activity(), api.merchants()])
      .then(([a, m]) => {
        setEvents(a.events)
        setNames(Object.fromEntries(m.merchants.map((x) => [x.id, x.name])))
      })
      .catch(() => setError("Could not load activity."))
  }, [])

  return (
    <div>
      <h1 className="text-[24px] leading-tight font-semibold tracking-tight">Activity</h1>
      <p className="mt-0.5 text-muted">Changes made on the platform, newest first. Secrets and links are never recorded.</p>
      <Card className="mt-6">
        {error ? <p role="alert" className="text-bad">{error}</p> : <ActivityList events={events} merchantNames={names} />}
      </Card>
    </div>
  )
}
