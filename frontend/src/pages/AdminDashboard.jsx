import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import Collapsible from '../components/Collapsible'

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'venues',   label: 'Venues',   icon: '🗺️' },
  { key: 'rules',    label: 'Rules',    icon: '📐' },
]

const featureCatalog = ['indoor', 'outdoor', 'showers', 'floodlights', 'parking', 'lockers']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [view, setView] = useState('overview')

  const [venues, setVenues] = useState([])
  const [rules, setRules] = useState([])

  const [venueForm, setVenueForm] = useState({
    id: null, name: '', sport: 'Football', address: '', city: '',
    lat: '', lng: '', price_per_hour: '', currency: 'EUR', features: [], active: 1,
  })
  const [savingVenue, setSavingVenue] = useState(false)
  const [venueMsg, setVenueMsg] = useState('')

  const [editingRule, setEditingRule] = useState(null)
  const [ruleForm, setRuleForm] = useState({ sport: '', min_players: 2, max_players: 10, default_duration_min: 60, icon: '' })
  const [savingRule, setSavingRule] = useState(false)
  const [ruleMsg, setRuleMsg] = useState('')

  useEffect(() => {
    if (!user?.id) navigate('/')
  }, [navigate, user?.id])

  const loadVenues = async () => {
    try {
      const r = await api.get('/venues/list.php')
      if (r.data.success) setVenues(r.data.venues)
    } catch {}
  }

  const loadRules = async () => {
    try {
      const r = await api.get('/sports/rules.php')
      if (r.data.success) setRules(r.data.rules)
    } catch {}
  }

  useEffect(() => {
    if (user?.id) {
      loadVenues()
      loadRules()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const toggleFeature = (feature) => {
    setVenueForm(f => ({
      ...f,
      features: f.features.includes(feature)
        ? f.features.filter(x => x !== feature)
        : [...f.features, feature],
    }))
  }

  const saveVenue = async (event) => {
    event.preventDefault()
    if (!venueForm.name || !venueForm.sport) return
    setSavingVenue(true); setVenueMsg('')
    try {
      const r = await api.post('/venues/create.php', {
        ...venueForm,
        lat: venueForm.lat || null,
        lng: venueForm.lng || null,
        price_per_hour: venueForm.price_per_hour || null,
      })
      if (r.data.success) {
        setVenueMsg(venueForm.id ? 'Venue updated' : 'Venue saved')
        setVenueForm({
          id: null, name: '', sport: venueForm.sport, address: '', city: '',
          lat: '', lng: '', price_per_hour: '', currency: 'EUR', features: [], active: 1,
        })
        await loadVenues()
        setTimeout(() => setVenueMsg(''), 2000)
      } else {
        setVenueMsg(r.data.message || 'Could not save venue')
      }
    } catch {
      setVenueMsg('Could not save venue')
    } finally {
      setSavingVenue(false)
    }
  }

  const deleteVenue = async (id) => {
    if (!confirm('Deactivate this venue? It will hide from members and captains.')) return
    try {
      const r = await api.post('/venues/delete.php', { id })
      if (r.data.success) await loadVenues()
    } catch {}
  }

  const editVenue = (venue) => {
    setVenueForm({
      id: venue.id,
      name: venue.name,
      sport: venue.sport,
      address: venue.address || '',
      city: venue.city || '',
      lat: venue.lat ?? '',
      lng: venue.lng ?? '',
      price_per_hour: venue.price_per_hour ?? '',
      currency: venue.currency || 'EUR',
      features: venue.features || [],
      active: 1,
    })
    setView('venues')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveRule = async (event) => {
    event.preventDefault()
    if (!ruleForm.sport) return
    setSavingRule(true); setRuleMsg('')
    try {
      const r = await api.post('/sports/rules.php', ruleForm)
      if (r.data.success) {
        setRuleMsg('Rule saved')
        setEditingRule(null)
        setRuleForm({ sport: '', min_players: 2, max_players: 10, default_duration_min: 60, icon: '' })
        await loadRules()
        setTimeout(() => setRuleMsg(''), 2000)
      } else {
        setRuleMsg(r.data.message || 'Could not save rule')
      }
    } catch {
      setRuleMsg('Could not save rule')
    } finally {
      setSavingRule(false)
    }
  }

  const editRule = (rule) => {
    setRuleForm({
      sport: rule.sport,
      min_players: rule.min_players,
      max_players: rule.max_players,
      default_duration_min: rule.default_duration_min,
      icon: rule.icon || '',
    })
    setEditingRule(rule.sport)
  }

  const venueCountBySport = useMemo(() => {
    const m = {}
    venues.forEach(v => { m[v.sport] = (m[v.sport] || 0) + 1 })
    return m
  }, [venues])

  const titleByView = {
    overview: { title: 'Operations', subtitle: 'Keep matching, events and venues healthy.' },
    venues:   { title: 'Venue manager', subtitle: 'Add, edit and deactivate venues.' },
    rules:    { title: 'Sport rules', subtitle: 'Define group sizes used across the app.' },
  }

  return (
    <AppShell
      role="Admin"
      navItems={NAV_ITEMS}
      activeView={view}
      onChangeView={setView}
      pageTitle={titleByView[view].title}
      pageSubtitle={titleByView[view].subtitle}
    >
      {view === 'overview' && (
        <div className="section-grid stagger">
          <section className="hero-card slide-up">
            <div className="eyebrow">Operations</div>
            <h1>Healthy network of players, captains and venues.</h1>
            <p>Manage venues, monitor matching coverage, and tune the sport rules that drive group sizes.</p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => setView('venues')}>Manage venues</button>
              <button className="btn btn-secondary btn-lg" onClick={() => setView('rules')}>Edit sport rules</button>
            </div>
          </section>

          <div className="form-grid">
            {[
              ['Active members', '128', '+18 this week'],
              ['Auto groups', '14', '4 need captains'],
              ['Manual events', '9', '3 created today'],
              ['Venue votes', '37', '82% resolved'],
            ].map(([label, value, hint]) => (
              <div className="card" key={label}>
                <div className="text-xs muted text-strong">{label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{value}</div>
                <div className="text-xs muted">{hint}</div>
              </div>
            ))}
          </div>

          <Collapsible title="Venue coverage" help="How venue supply maps to demand by sport." defaultOpen>
            <div className="form-grid">
              {rules.map(r => (
                <div className="card" key={r.sport} style={{ padding: 16 }}>
                  <div className="row-between">
                    <strong>{r.icon} {r.sport}</strong>
                    <span className="pill">{venueCountBySport[r.sport] || 0} venues</span>
                  </div>
                  <div className="text-xs muted mt-1">Group: {r.min_players}–{r.max_players} · {r.default_duration_min} min</div>
                </div>
              ))}
              {rules.length === 0 && <div className="empty"><strong>No rules</strong><span>Add some on the Rules page.</span></div>}
            </div>
          </Collapsible>
        </div>
      )}

      {view === 'venues' && (
        <div className="section-grid stagger">
          <Collapsible
            title={venueForm.id ? `Edit venue · ${venueForm.name}` : 'Add a venue'}
            help="Visible to members and captains immediately."
            defaultOpen
            right={venueMsg ? <span className="pill pill-success">{venueMsg}</span> : null}
          >
            <form onSubmit={saveVenue} className="section-grid">
              <div className="form-grid">
                <div className="field">
                  <label>Name</label>
                  <input value={venueForm.name} onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Sport</label>
                  <select value={venueForm.sport} onChange={e => setVenueForm({ ...venueForm, sport: e.target.value })}>
                    {(rules.length ? rules.map(r => r.sport) : ['Football', 'Basketball', 'Tennis', 'Running', 'Volleyball', 'Padel']).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>City</label>
                  <input value={venueForm.city} onChange={e => setVenueForm({ ...venueForm, city: e.target.value })} placeholder="e.g. Islamabad" />
                </div>
                <div className="field">
                  <label>Address</label>
                  <input value={venueForm.address} onChange={e => setVenueForm({ ...venueForm, address: e.target.value })} placeholder="Street, sector" />
                </div>
                <div className="field">
                  <label>Latitude</label>
                  <input type="number" step="0.0000001" value={venueForm.lat} onChange={e => setVenueForm({ ...venueForm, lat: e.target.value })} />
                </div>
                <div className="field">
                  <label>Longitude</label>
                  <input type="number" step="0.0000001" value={venueForm.lng} onChange={e => setVenueForm({ ...venueForm, lng: e.target.value })} />
                </div>
                <div className="field">
                  <label>Price / hour</label>
                  <input type="number" step="0.01" value={venueForm.price_per_hour} onChange={e => setVenueForm({ ...venueForm, price_per_hour: e.target.value })} />
                </div>
                <div className="field">
                  <label>Currency</label>
                  <input value={venueForm.currency} onChange={e => setVenueForm({ ...venueForm, currency: e.target.value })} />
                </div>
              </div>

              <div className="field">
                <label>Features</label>
                <div className="chip-grid">
                  {featureCatalog.map(f => (
                    <button
                      key={f}
                      type="button"
                      className={`chip ${venueForm.features.includes(f) ? 'active' : ''}`}
                      onClick={() => toggleFeature(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
                {venueForm.id && (
                  <button type="button" className="btn btn-ghost" onClick={() => setVenueForm({
                    id: null, name: '', sport: venueForm.sport, address: '', city: '',
                    lat: '', lng: '', price_per_hour: '', currency: 'EUR', features: [], active: 1,
                  })}>Cancel</button>
                )}
                <button className="btn btn-primary" disabled={savingVenue}>
                  {savingVenue && <span className="spinner" aria-hidden />}
                  {savingVenue ? 'Saving…' : (venueForm.id ? 'Update venue' : 'Add venue')}
                </button>
              </div>
            </form>
          </Collapsible>

          <div className="card">
            <div className="card-row">
              <div>
                <div className="card-title">Venue directory</div>
                <div className="card-subtitle">{venues.length} active venues</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadVenues}>Refresh</button>
            </div>

            <div className="event-grid-3 stagger">
              {venues.map(v => (
                <div className="card" key={v.id} style={{ padding: 16 }}>
                  <div className="row-between">
                    <strong>{v.name}</strong>
                    <span className="pill">{v.sport}</span>
                  </div>
                  <div className="text-xs muted mt-1">{v.address || v.city || '—'}</div>
                  <div className="row gap-sm mt-2" style={{ flexWrap: 'wrap' }}>
                    <span className="pill">{v.price_per_hour ? `${v.currency} ${v.price_per_hour}/h` : 'Free'}</span>
                    {v.features?.slice(0, 3).map(f => <span className="pill" key={f}>{f}</span>)}
                  </div>
                  <div className="row gap-sm mt-2" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => editVenue(v)}>Edit</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => deleteVenue(v.id)}>Deactivate</button>
                  </div>
                </div>
              ))}
              {venues.length === 0 && <div className="empty"><strong>No venues yet</strong><span>Add the first one with the form above.</span></div>}
            </div>
          </div>
        </div>
      )}

      {view === 'rules' && (
        <div className="section-grid stagger">
          <Collapsible
            title={editingRule ? `Edit rule · ${editingRule}` : 'Add or upsert sport rule'}
            help="Used to validate event creation and group sizing across the app."
            defaultOpen
            right={ruleMsg ? <span className="pill pill-success">{ruleMsg}</span> : null}
          >
            <form onSubmit={saveRule} className="section-grid">
              <div className="form-grid">
                <div className="field">
                  <label>Sport</label>
                  <input value={ruleForm.sport} onChange={e => setRuleForm({ ...ruleForm, sport: e.target.value })} required disabled={!!editingRule} />
                </div>
                <div className="field">
                  <label>Icon (emoji)</label>
                  <input value={ruleForm.icon} onChange={e => setRuleForm({ ...ruleForm, icon: e.target.value })} placeholder="⚽" />
                </div>
                <div className="field">
                  <label>Min players</label>
                  <input type="number" min="1" value={ruleForm.min_players} onChange={e => setRuleForm({ ...ruleForm, min_players: Number(e.target.value) })} required />
                </div>
                <div className="field">
                  <label>Max players</label>
                  <input type="number" min="1" value={ruleForm.max_players} onChange={e => setRuleForm({ ...ruleForm, max_players: Number(e.target.value) })} required />
                </div>
                <div className="field">
                  <label>Default duration (min)</label>
                  <input type="number" min="15" value={ruleForm.default_duration_min} onChange={e => setRuleForm({ ...ruleForm, default_duration_min: Number(e.target.value) })} />
                </div>
              </div>
              <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
                {editingRule && (
                  <button type="button" className="btn btn-ghost" onClick={() => {
                    setEditingRule(null)
                    setRuleForm({ sport: '', min_players: 2, max_players: 10, default_duration_min: 60, icon: '' })
                  }}>Cancel</button>
                )}
                <button className="btn btn-primary" disabled={savingRule}>
                  {savingRule && <span className="spinner" aria-hidden />}
                  {savingRule ? 'Saving…' : (editingRule ? 'Update rule' : 'Save rule')}
                </button>
              </div>
            </form>
          </Collapsible>

          <div className="card">
            <div className="card-row">
              <div>
                <div className="card-title">Active rules</div>
                <div className="card-subtitle">Tap to edit.</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadRules}>Refresh</button>
            </div>
            <div className="form-grid">
              {rules.map(r => (
                <button type="button" key={r.sport} className="card" style={{ padding: 16, textAlign: 'left' }} onClick={() => editRule(r)}>
                  <div className="row-between">
                    <strong>{r.icon} {r.sport}</strong>
                    <span className="pill">{r.min_players}–{r.max_players}</span>
                  </div>
                  <div className="text-xs muted mt-1">{r.default_duration_min} min duration</div>
                  <div className="text-xs mt-2" style={{ color: 'var(--green-2)' }}>Edit →</div>
                </button>
              ))}
              {rules.length === 0 && <div className="empty"><strong>No rules</strong><span>Add the first one with the form above.</span></div>}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
