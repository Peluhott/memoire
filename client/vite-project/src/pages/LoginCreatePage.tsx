import { useState } from 'react'
import './LoginCreatePage.css'

type LoginCreatePageProps = {
  busy: boolean
  message: string
  onLogin: (payload: { username: string; password: string }) => Promise<void>
  onCreateAccount: (payload: { email: string; username: string; password: string }) => Promise<void>
}

function LoginCreatePage({
  busy,
  message,
  onLogin,
  onCreateAccount,
}: LoginCreatePageProps) {
  const [mode, setMode] = useState<'login' | 'create'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loginValues, setLoginValues] = useState({ username: '', password: '' })
  const [createValues, setCreateValues] = useState({ email: '', username: '', password: '' })

  return (
    <main className="auth-layout">
      <section className="auth-chrome">
        <div className="auth-brand">
          <span className="auth-brand__mark">M</span>
          <span className="auth-brand__text">Memoire</span>
        </div>
        <div className="auth-language">Memory resurfacing, built around email.</div>
      </section>

      <section className="auth-card">
        <div className="auth-card__tabs">
          <button
            className={mode === 'login' ? 'auth-card__tab is-active' : 'auth-card__tab'}
            type="button"
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            className={mode === 'create' ? 'auth-card__tab is-active' : 'auth-card__tab'}
            type="button"
            onClick={() => setMode('create')}
          >
            Create account
          </button>
        </div>

        {mode === 'login' ? (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault()
              void onLogin(loginValues)
            }}
          >
            <h1>Log in</h1>
            <p>
              Need a Memoire account?{' '}
              <button className="auth-inline-button" type="button" onClick={() => setMode('create')}>
                Create one
              </button>
            </p>
            <label>
              Username
              <input
                required
                value={loginValues.username}
                onChange={(event) =>
                  setLoginValues((current) => ({ ...current, username: event.target.value }))
                }
              />
            </label>
            <label>
              Password
              <div className="auth-password">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={loginValues.password}
                  onChange={(event) =>
                    setLoginValues((current) => ({ ...current, password: event.target.value }))
                  }
                />
                <button
                  className="auth-password__toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            <label className="auth-check">
              <input type="checkbox" defaultChecked />
              <span>Keep me logged in</span>
            </label>
            <button disabled={busy} type="submit">
              {busy ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        ) : (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault()
              void onCreateAccount(createValues)
            }}
          >
            <h1>Create account</h1>
            <p>Set up a space to save photos and let Memoire send them back later.</p>
            <label>
              Email
              <input
                required
                type="email"
                value={createValues.email}
                onChange={(event) =>
                  setCreateValues((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>
            <label>
              Username
              <input
                required
                value={createValues.username}
                onChange={(event) =>
                  setCreateValues((current) => ({ ...current, username: event.target.value }))
                }
              />
            </label>
            <label>
              Password
              <input
                required
                minLength={8}
                type="password"
                value={createValues.password}
                onChange={(event) =>
                  setCreateValues((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>
            <button disabled={busy} type="submit">
              {busy ? 'Creating...' : 'Create account'}
            </button>
          </form>
        )}

        <p className="auth-card__message" role="status">
          {message}
        </p>
      </section>
    </main>
  )
}

export default LoginCreatePage
