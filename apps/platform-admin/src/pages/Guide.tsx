import { useState } from "react"
import { SlidingPills } from "@/components/SlidingPills"
import { LocalGuide } from "./GuideLocal"
import { VpsGuide } from "./GuideVps"

type Tab = "vps" | "local"

/** Step-by-step manuals: production on the VPS, and local development on Windows. */
export function Guide() {
  const [tab, setTab] = useState<Tab>(() => (window.location.hash.startsWith("#local") ? "local" : "vps"))

  return (
    <div>
      <h1 className="text-[24px] leading-tight font-semibold tracking-tight">Guide</h1>
      <p className="mt-0.5 max-w-2xl text-muted">
        {tab === "vps"
          ? "Set up and run Emora on the Hostinger VPS: server, databases, migrations, services, HTTPS, updates and backups. Commands are for the Ubuntu terminal over SSH."
          : "Run Emora on a Windows computer for development and testing. Commands are for PowerShell."}{" "}
        Use the copy button on each command. Never paste passwords or secrets into chat or commit them to git.
      </p>
      <div className="mt-5">
        <SlidingPills<Tab>
          label="Guide"
          value={tab}
          onChange={setTab}
          options={[
            { value: "vps", label: "VPS (production)" },
            { value: "local", label: "Local (Windows)" },
          ]}
        />
      </div>
      <div className="mt-6">{tab === "vps" ? <VpsGuide /> : <LocalGuide />}</div>
    </div>
  )
}
