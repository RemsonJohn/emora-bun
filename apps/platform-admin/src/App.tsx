import { useCallback, useEffect, useState } from "react"
import { ApiError, api, type Me } from "@/lib/api"
import { RouterProvider, useRouter } from "@/lib/router"
import { Shell } from "@/components/Shell"
import { ActivityPage } from "@/pages/Activity"
import { MerchantDetail } from "@/pages/MerchantDetail"
import { Merchants } from "@/pages/Merchants"
import { Security } from "@/pages/Security"
import { SetupTwoFactor } from "@/pages/SetupTwoFactor"
import { SignIn } from "@/pages/SignIn"

type State = { kind: "loading" } | { kind: "signed-out" } | { kind: "needs-2fa"; me: Me } | { kind: "ready"; me: Me }

function Routes({ me }: { me: Me }) {
  const { path } = useRouter()
  const pathname = path.split("?")[0]!
  const merchant = /^\/merchants\/([^/]+)$/.exec(pathname)
  if (merchant) return <MerchantDetail key={merchant[1]} id={merchant[1]!} me={me} />
  if (pathname === "/activity") return <ActivityPage />
  if (pathname === "/security") return <Security me={me} />
  return <Merchants me={me} />
}

function Root() {
  const [state, setState] = useState<State>({ kind: "loading" })
  const { navigate } = useRouter()

  const refresh = useCallback(async () => {
    try {
      const me = await api.me()
      setState(me.mfa_enabled ? { kind: "ready", me } : { kind: "needs-2fa", me })
    } catch (err) {
      setState({ kind: "signed-out" })
      if (!(err instanceof ApiError)) console.error(err)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signOut = async () => {
    await api.signOut().catch(() => {})
    setState({ kind: "signed-out" })
    navigate("/merchants")
  }

  if (state.kind === "loading") {
    return <div className="grid min-h-screen place-items-center text-muted">Loading…</div>
  }
  if (state.kind === "signed-out") return <SignIn onSignedIn={() => void refresh()} />
  if (state.kind === "needs-2fa") return <SetupTwoFactor me={state.me} onDone={() => void signOut()} />
  if (!state.me.user.role) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <p className="font-medium">Your account has no Emora role yet.</p>
          <p className="mt-1 text-muted">Ask a platform admin to give you access.</p>
          <button type="button" onClick={() => void signOut()} className="mt-4 text-accent hover:underline">Sign out</button>
        </div>
      </div>
    )
  }
  return (
    <Shell me={state.me} onSignOut={() => void signOut()}>
      <Routes me={state.me} />
    </Shell>
  )
}

export function App() {
  return (
    <RouterProvider>
      <Root />
    </RouterProvider>
  )
}
