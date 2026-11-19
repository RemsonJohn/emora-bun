import { createContext, forwardRef, useCallback, useContext, useEffect, useState } from "react"

/** A very small history router: paths like /merchants and /merchants/:id. */
type Router = { path: string; navigate: (to: string) => void }
const RouterContext = createContext<Router>({ path: "/", navigate: () => {} })

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname + window.location.search)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname + window.location.search)
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])
  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname + window.location.search) return
    window.history.pushState(null, "", to)
    setPath(to)
    window.scrollTo({ top: 0 })
  }, [])
  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>
}

export const useRouter = () => useContext(RouterContext)

/** In-app link: plain clicks navigate without a reload; modified clicks behave like a normal link. */
export const Link = forwardRef<HTMLAnchorElement, { to: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">>(function Link(
  { to, children, ...rest },
  ref
) {
  const { navigate } = useRouter()
  return (
    <a
      ref={ref}
      href={to}
      onClick={(e) => {
        rest.onClick?.(e)
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
})
