import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  LoaderCircle,
  ShoppingBag,
} from "lucide-react";
import { api, errorMessage, sdk } from "../../lib/medusa";

export function Login({
  onLogin,
  onDemo,
}: {
  onLogin: (name: string) => void;
  onDemo: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await sdk.auth.login("user", "emailpass", {
        email,
        password,
      });
      if (typeof result !== "string") {
        await sdk.auth.logout().catch(() => {});
        throw new Error(
          "This account requires another sign-in step. Please use Medusa Admin.",
        );
      }
      const { user } = await api<{
        user: { first_name?: string; email: string };
      }>("/admin/users/me");
      onLogin(user.first_name || user.email.split("@")[0]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="brand-mark">
          e<span />
        </span>
        emora
      </div>
      <div className="login-layout">
        <section className="login-intro">
          <span className="intro-line" />
          <h1>
            A little less admin.
            <br />A lot more possibility.
          </h1>
          <p>
            Your products, your people, your next big thing.
            <br />A calm place to keep it all moving.
          </p>
          <div className="login-signature">
            Built for independent businesses.
            <br />
            <span>Made for yours.</span>
          </div>
        </section>
        <section className="login-card">
          <span className="store-icon">
            <ShoppingBag size={24} />
          </span>
          <h2>Welcome to your store</h2>
          <p>Sign in with your Medusa admin account.</p>
          <form onSubmit={submit}>
            <label>
              Email address
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourstore.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </label>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}
            <button className="button primary" disabled={loading}>
              {loading && <LoaderCircle className="spin" size={16} />}Sign in{" "}
              <ArrowRight size={16} />
            </button>
          </form>
          <div className="login-demo">
            <span>Just taking a look?</span>
            <button onClick={onDemo}>
              Explore the demo <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
      </div>
      <footer>
        Emora Admin<span>Your business. Beautifully organised.</span>
      </footer>
    </div>
  );
}
