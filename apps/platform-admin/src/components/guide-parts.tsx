import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Card } from "@/components/ui"

/** Building blocks for the Guide pages: copyable command blocks, numbered steps and sections. */
export function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group relative my-2">
      <pre className="overflow-x-auto rounded-lg border border-line bg-soft px-3.5 py-2.5 pr-12 font-mono text-[12px] leading-relaxed whitespace-pre">
        {children}
      </pre>
      <button
        type="button"
        aria-label="Copy command"
        onClick={async () => {
          await navigator.clipboard.writeText(children)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        }}
        className="absolute top-2 right-2 grid size-7 place-items-center rounded-md border border-line bg-surface text-muted opacity-80 transition hover:text-ink group-hover:opacity-100"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}

export function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative pl-9">
      <span aria-hidden="true" className="absolute top-0 left-0 grid size-6 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
        {n}
      </span>
      <p className="font-medium">{title}</p>
      <div className="mt-1 space-y-2 text-muted [&_strong]:text-ink">{children}</div>
    </li>
  )
}

export function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <Card title={title}>
        {intro && <p className="mb-4 text-muted">{intro}</p>}
        <ol className="space-y-5">{children}</ol>
      </Card>
    </section>
  )
}

export const C = ({ children }: { children: React.ReactNode }) => <code className="rounded bg-soft px-1 py-0.5 font-mono text-[12px] text-ink">{children}</code>
