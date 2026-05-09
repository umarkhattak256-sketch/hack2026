import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const apiBase = '/api/auth'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [role, setRole] = useState('donor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const routeUser = user => {
    if (user.role === 'ngo') navigate('/captain')
    else if (user.role === 'admin') navigate('/admin')
    else navigate('/member')
  }

  const submit = async event => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const response = await axios.post(`${apiBase}/login.php`, { email, password })
        if (!response.data.success) {
          setError(response.data.message || 'Login failed')
        } else {
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('user', JSON.stringify(response.data.user))
          routeUser(response.data.user)
        }
      } else {
        const response = await axios.post(`${apiBase}/register.php`, { name, email, password, role })
        if (!response.data.success) {
          setError(response.data.message || 'Registration failed')
        } else {
          setIsLogin(true)
          setError('Account created. Sign in to continue.')
        }
      }
    } catch (err) {
      console.error('Auth API request failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setError('Could not reach the website API. Check XAMPP and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="brand-lockup">
          <div className="brand-mark">S2M</div>
          <strong>ShowUp2Move</strong>
        </div>
        <div className="hero-copy">
          <div className="eyebrow">Hackathon sports matching website</div>
          <h1>Find people nearby and play today.</h1>
          <p>Members set sports, skill, availability and area. The website forms groups, assigns captains, supports event chat and helps choose venues.</p>
        </div>
        <div className="stat-strip">
          <div><strong>12 min</strong><span>from yes to group</span></div>
          <div><strong>6 sports</strong><span>ready to match</span></div>
          <div><strong>1 click</strong><span>ShowUpToday</span></div>
        </div>
      </section>

      <section className="auth-card">
        <div className="tabs">
          <button className={isLogin ? 'active' : ''} onClick={() => { setIsLogin(true); setError('') }}>Sign in</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => { setIsLogin(false); setError('') }}>Register</button>
        </div>

        <h2>{isLogin ? 'Welcome back' : 'Create profile'}</h2>
        <p>{isLogin ? 'Continue to your matching dashboard.' : 'Start with the essentials. You can tune preferences later.'}</p>

        {error && <div className={error.includes('created') ? 'notice success' : 'notice'}>{error}</div>}

        <form onSubmit={submit} className="stack-form">
          {!isLogin && (
            <>
              <label>Full name
                <input value={name} onChange={event => setName(event.target.value)} placeholder="Your name" required />
              </label>
              <div className="role-picker">
                <button type="button" className={role === 'donor' ? 'active' : ''} onClick={() => setRole('donor')}>
                  <strong>Member</strong>
                  <span>I want to join games</span>
                </button>
                <button type="button" className={role === 'ngo' ? 'active' : ''} onClick={() => setRole('ngo')}>
                  <strong>Captain</strong>
                  <span>I organize events</span>
                </button>
              </div>
            </>
          )}
          <label>Email
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" required />
          </label>
          <button disabled={loading}>{loading ? 'Please wait...' : isLogin ? 'Enter website' : 'Create account'}</button>
        </form>
      </section>
    </main>
  )
}
