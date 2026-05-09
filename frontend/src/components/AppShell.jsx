import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AppShell({
  role = 'Member',
  navItems = [],
  activeView,
  onChangeView,
  rightActions = null,
  pageTitle,
  pageSubtitle,
  children,
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = (user?.name || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S2M</div>
          <div className="brand-text">
            <strong>ShowUp2Move</strong>
            <span>{role} workspace</span>
          </div>
        </div>

        <nav className="nav-rail">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`nav-item ${activeView === item.key ? 'active' : ''}`}
              onClick={() => onChangeView(item.key)}
            >
              <span className="icon" aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? <span className="badge">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.profile_pic_url
                ? <img src={user.profile_pic_url} alt={user.name} />
                : <span>{initials}</span>}
            </div>
            <div className="sidebar-user-meta">
              <strong>{user?.name || 'You'}</strong>
              <span>{user?.role || role.toLowerCase()}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            <span aria-hidden>↩</span> Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-topbar">
          <div>
            <h1>{pageTitle}</h1>
            {pageSubtitle && <div className="subtitle">{pageSubtitle}</div>}
          </div>
          <div className="topbar-spacer" />
          {rightActions}
        </div>

        <div className={mounted ? 'view enter' : 'view'} key={activeView}>
          {children}
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Primary">
        {navItems.map(item => (
          <button
            key={item.key}
            className={activeView === item.key ? 'active' : ''}
            onClick={() => onChangeView(item.key)}
          >
            <span className="icon" aria-hidden>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
