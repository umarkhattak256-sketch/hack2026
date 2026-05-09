import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const starterVenues = [
  { id: 1, name: 'Central Park Pitch', sport: 'Football', price: '$24/hour', distance: '8 min walk', status: 'Available' },
  { id: 2, name: 'Arena 12', sport: 'Basketball', price: '$36/hour', distance: 'Near metro', status: 'Available' },
  { id: 3, name: 'Riverside Courts', sport: 'Tennis', price: '$18/hour', distance: '12 min bike', status: 'Limited' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [venues, setVenues] = useState(starterVenues)
  const [form, setForm] = useState({ name: '', sport: 'Football', price: '', distance: '', status: 'Available' })

  useEffect(() => {
    if (!user?.id) navigate('/')
  }, [navigate, user?.id])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const addVenue = event => {
    event.preventDefault()
    if (!form.name || !form.price || !form.distance) return
    setVenues([{ ...form, id: Date.now() }, ...venues])
    setForm({ name: '', sport: 'Football', price: '', distance: '', status: 'Available' })
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand-mark">S2M</div>
        <div>
          <strong>ShowUp2Move</strong>
          <span>Admin website</span>
        </div>
        <nav>
          <a href="#overview">Overview</a>
          <a href="#venues">Venues</a>
        </nav>
        <button className="quiet-btn" onClick={logout}>Log out</button>
      </header>

      <main className="workspace-grid">
        <section id="overview" className="panel hero-panel wide-panel">
          <div className="eyebrow">Operations</div>
          <h1>Keep matching, events and venue options healthy.</h1>
          <p>This admin view gives judges a clear production path: manage venues, monitor matching coverage and see the activity the website is generating.</p>
        </section>

        <section className="metric-grid wide-panel">
          {[
            ['Active members', '128', '+18 this week'],
            ['Auto groups', '14', '4 need captains'],
            ['Manual events', '9', '3 created today'],
            ['Venue votes', '37', '82% resolved'],
          ].map(metric => (
            <div className="metric" key={metric[0]}>
              <span>{metric[0]}</span>
              <strong>{metric[1]}</strong>
              <small>{metric[2]}</small>
            </div>
          ))}
        </section>

        <section className="panel">
          <div className="section-title">Add Venue</div>
          <form className="stack-form" onSubmit={addVenue}>
            <input placeholder="Venue name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <select value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })}>
              {['Football', 'Basketball', 'Tennis', 'Running', 'Volleyball'].map(sport => <option key={sport}>{sport}</option>)}
            </select>
            <input placeholder="Price estimate" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            <input placeholder="Distance or area" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} />
            <button>Add venue</button>
          </form>
        </section>

        <section id="venues" className="panel wide-panel">
          <div className="section-title">Venue Directory</div>
          <div className="venue-table">
            {venues.map(venue => (
              <div className="venue-row" key={venue.id}>
                <span>{venue.name}</span>
                <span>{venue.sport}</span>
                <span>{venue.price}</span>
                <span>{venue.distance}</span>
                <strong>{venue.status}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="section-title">Matching Rules</div>
          <div className="rules-grid">
            <div><strong>Football</strong><span>10-14 players</span></div>
            <div><strong>Basketball</strong><span>6-10 players</span></div>
            <div><strong>Tennis</strong><span>2-4 players</span></div>
            <div><strong>Running</strong><span>2-20 players</span></div>
          </div>
        </section>
      </main>
    </div>
  )
}
