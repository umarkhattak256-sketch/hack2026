import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [role, setRole] = useState('member')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const routeUser = user => {
    if (user.role === 'admin') navigate('/admin')
    else if (user.role === 'captain') navigate('/captain')
    else navigate('/member')
  }

  const submit = async event => {
    event.preventDefault()
    setLoading(true); setError('')
    try {
      if (isLogin) {
        const response = await api.post('/auth/login.php', { email, password })
        if (!response.data.success) {
          setError(response.data.message || 'Login failed')
        } else {
          login(response.data.token, response.data.user)
          routeUser(response.data.user)
        }
      } else {
        const response = await api.post('/auth/register.php', { name, email, password, role })
        if (!response.data.success) {
          setError(response.data.message || 'Registration failed')
        } else {
          setIsLogin(true)
          setError('Account created — sign in to continue.')
        }
      }
    } catch (err) {
      setError('Could not reach the website API. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero slide-up">
        <div className="brand">
          <div className="brand-mark">S2M</div>
          <div className="brand-text">
            <strong>ShowUp2Move</strong>
            <span>Get on the pitch in minutes</span>
          </div>
        </div>

        <div style={{ maxWidth: 720 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Sports matching · Hackathon</div>
          <h1>Find people nearby and play <em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg, var(--green), var(--blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>today</em>.</h1>
          <p style={{ marginTop: 16, fontSize: 16, maxWidth: 540 }}>
            Members set sports, skill, availability and area. The app forms groups, assigns captains, runs venue votes,
            and keeps everyone in sync — so you spend energy on the game, not the planning.
          </p>
        </div>

        <div className="stat-strip">
          <div><strong>~12 min</strong><span>from yes to group</span></div>
          <div><strong>6 sports</strong><span>ready to match</span></div>
          <div><strong>1 tap</strong><span>ShowUpToday</span></div>
        </div>
      </section>

      <section className="auth-card scale-in">
        <div className="auth-tabs" role="tablist">
          <button className={isLogin ? 'active' : ''} onClick={() => { setIsLogin(true); setError('') }}>Sign in</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => { setIsLogin(false); setError('') }}>Register</button>
        </div>

        <div>
          <h2>{isLogin ? 'Welcome back' : 'Create profile'}</h2>
          <p className="text-sm">{isLogin ? 'Continue to your matching dashboard.' : 'Start with the essentials. You can tune preferences later.'}</p>
        </div>

        {error && (
          <div className={`notice ${error.includes('created') ? 'success' : ''}`}>{error}</div>
        )}

        <form className="section-grid" onSubmit={submit}>
          {!isLogin && (
            <>
              <div className="field">
                <label>Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
              </div>
              <div className="field">
                <label>I am a…</label>
                <div className="role-grid">
                  <button type="button" className={`role-pick ${role === 'member' ? 'active' : ''}`} onClick={() => setRole('member')}>
                    <strong>Member</strong>
                    <span>I want to join games</span>
                  </button>
                  <button type="button" className={`role-pick ${role === 'captain' ? 'active' : ''}`} onClick={() => setRole('captain')}>
                    <strong>Captain</strong>
                    <span>I organize events</span>
                  </button>
                </div>
              </div>
            </>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
          </div>
          <button className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading && <span className="spinner" aria-hidden />}
            {loading ? 'Please wait…' : isLogin ? 'Enter website' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  )
}
