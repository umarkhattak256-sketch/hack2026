import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const mockDonations = [
  { id: 1, donor: 'Ahmed K.', amount: 50, currency: 'USD', cause: 'Flood Relief', date: 'May 1, 2026', status: 'held', milestones: [{ title: 'Supplies purchased', done: false, amount: 17 }, { title: 'Beneficiaries helped', done: false, amount: 17 }, { title: 'Final report', done: false, amount: 16 }] },
  { id: 2, donor: 'Maria S.', amount: 30, currency: 'USD', cause: 'Food Security', date: 'Apr 28, 2026', status: 'partial', milestones: [{ title: 'Food kits purchased', done: true, amount: 10 }, { title: 'Distributed to families', done: false, amount: 10 }, { title: 'Final report', done: false, amount: 10 }] },
  { id: 3, donor: 'John D.', amount: 100, currency: 'USD', cause: 'Shelter', date: 'Apr 20, 2026', status: 'completed', milestones: [{ title: 'Materials bought', done: true, amount: 34 }, { title: 'Construction done', done: true, amount: 33 }, { title: 'Final report', done: true, amount: 33 }] },
]

const statusConfig = {
  completed: { label: 'Completed', color: '#10B981', bg: '#ECFDF5' },
  partial: { label: 'In Progress', color: '#F59E0B', bg: '#FFFBEB' },
  held: { label: 'Awaiting Proof', color: '#6366F1', bg: '#EEF2FF' },
}

export default function NGODashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDonation, setSelectedDonation] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { if (!user?.id) navigate('/') }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleUpload = async () => {
    if (!uploadFile || !milestoneTitle) return
    setUploading(true)
    await new Promise(r => setTimeout(r, 2000))
    setUploading(false)
    setUploadSuccess(true)
    setTimeout(() => setUploadSuccess(false), 3000)
    setUploadFile(null)
    setMilestoneTitle('')
  }

  const totalReceived = mockDonations.reduce((a, b) => a + b.amount, 0)
  const totalReleased = mockDonations.reduce((a, b) => a + b.milestones.filter(m => m.done).reduce((x, y) => x + y.amount, 0), 0)
  const pendingRelease = totalReceived - totalReleased
  const avatarInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'N'

  const s = {
    page: { minHeight: '100vh', background: '#F9FAFB', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" },
    nav: { background: 'white', borderBottom: '1px solid #F3F4F6', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100 },
    logo: { display: 'flex', alignItems: 'center', gap: '8px' },
    logoIcon: { width: '28px', height: '28px', borderRadius: '7px', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    logoText: { fontSize: '15px', fontWeight: '600', color: '#111827', letterSpacing: '-0.3px' },
    ngoBadge: { fontSize: '11px', fontWeight: '600', color: '#6366F1', background: '#EEF2FF', padding: '3px 10px', borderRadius: '20px' },
    navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
    avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#6366F1' },
    logoutBtn: { fontSize: '13px', padding: '6px 14px', borderRadius: '7px', border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', cursor: 'pointer' },
    body: { display: 'flex', minHeight: 'calc(100vh - 60px)' },
    sidebar: { width: '220px', background: 'white', borderRight: '1px solid #F3F4F6', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '4px' },
    sideItem: (active) => ({ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '500' : '400', color: active ? '#6366F1' : '#6B7280', background: active ? '#EEF2FF' : 'transparent', transition: 'all 0.15s' }),
    main: { flex: 1, padding: '32px' },
    pageTitle: { fontSize: '22px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px', marginBottom: '6px' },
    pageSub: { fontSize: '14px', color: '#9CA3AF', marginBottom: '28px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
    statCard: { background: 'white', border: '1px solid #F3F4F6', borderRadius: '12px', padding: '20px 24px' },
    statLabel: { fontSize: '12px', color: '#9CA3AF', marginBottom: '8px', fontWeight: '500' },
    statValue: (color) => ({ fontSize: '26px', fontWeight: '700', color: color || '#111827', letterSpacing: '-0.8px' }),
    statChange: { fontSize: '12px', color: '#10B981', marginTop: '4px' },
    card: { background: 'white', border: '1px solid #F3F4F6', borderRadius: '16px', padding: '24px', marginBottom: '16px' },
    donationRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F9FAFB', cursor: 'pointer', transition: 'all 0.15s' },
    uploadBox: { border: '2px dashed #E5E7EB', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#FAFAFA' },
    uploadBtn: { padding: '11px 24px', fontSize: '13px', fontWeight: '600', background: '#6366F1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
    input: { width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#FAFAFA', color: '#111827', outline: 'none', boxSizing: 'border-box' },
    label: { fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' },
    successBanner: { background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'donations', label: 'Donations', icon: '💰' },
    { id: 'upload', label: 'Upload Proof', icon: '📸' },
    { id: 'milestones', label: 'Milestones', icon: '🎯' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={s.logo}>
            <div style={s.logoIcon}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm3.5 5.5l-4 4c-.2.2-.51.2-.71 0l-2-2c-.2-.2-.2-.51 0-.71.2-.2.51-.2.71 0L8 10.29l3.64-3.65c.2-.2.51-.2.71 0 .2.2.2.52 0 .71z" fill="white"/>
              </svg>
            </div>
            <span style={s.logoText}>DonorTrace</span>
          </div>
          <div style={s.ngoBadge}>NGO Portal</div>
        </div>
        <div style={s.navRight}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={s.avatar}>{avatarInitials}</div>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{user?.name || 'NGO'}</span>
          </div>
          <button onClick={handleLogout} style={s.logoutBtn}>Log out</button>
        </div>
      </nav>

      <div style={s.body}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)} style={s.sideItem(activeTab === item.id)}>
              <span style={{ fontSize: '15px' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '8px', fontWeight: '500' }}>VERIFICATION STATUS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
              <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '500' }}>Verified NGO ✓</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={s.main}>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <div style={s.pageTitle}>NGO Overview</div>
              <div style={s.pageSub}>Your donation transparency dashboard</div>

              {/* Stats */}
              <div style={s.statsGrid}>
                {[
                  { label: 'Total received', value: `$${totalReceived}`, change: '+$30 this week', color: '#111827' },
                  { label: 'Released to you', value: `$${totalReleased}`, change: 'After proof verified', color: '#10B981' },
                  { label: 'Pending release', value: `$${pendingRelease}`, change: 'Upload proof to unlock', color: '#F59E0B' },
                  { label: 'Active donors', value: mockDonations.length, change: 'Across 3 projects', color: '#6366F1' },
                ].map((stat, i) => (
                  <div key={i} style={s.statCard}>
                    <div style={s.statLabel}>{stat.label}</div>
                    <div style={s.statValue(stat.color)}>{stat.value}</div>
                    <div style={s.statChange}>{stat.change}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div style={s.card}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Recent Donations</div>
                <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '20px' }}>Latest donations received by your NGO</div>
                {mockDonations.map((donation, i) => (
                  <div key={i} style={{ ...s.donationRow, borderBottom: i < mockDonations.length - 1 ? '1px solid #F9FAFB' : 'none' }}
                    onClick={() => { setSelectedDonation(donation); setActiveTab('donations') }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>💰</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{donation.donor}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{donation.cause} · {donation.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>${donation.amount}</div>
                      <div style={{ fontSize: '11px', fontWeight: '500', color: statusConfig[donation.status].color, background: statusConfig[donation.status].bg, padding: '2px 8px', borderRadius: '20px', display: 'inline-block', marginTop: '2px' }}>
                        {statusConfig[donation.status].label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* How it works */}
              <div style={s.card}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>How Fund Release Works</div>
                <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
                  {[
                    { step: '1', title: 'Donor gives', desc: 'Donation held in Stripe escrow', icon: '💳', color: '#6366F1' },
                    { step: '2', title: 'You do the work', desc: 'Complete your milestone project', icon: '🏗️', color: '#F59E0B' },
                    { step: '3', title: 'Upload proof', desc: 'Photo + receipt + GPS data', icon: '📸', color: '#EC4899' },
                    { step: '4', title: 'Funds released', desc: 'Money transferred to your account', icon: '✅', color: '#10B981' },
                  ].map((step, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: step.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 12px' }}>{step.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{step.title}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: '1.5' }}>{step.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* DONATIONS TAB */}
          {activeTab === 'donations' && (
            <>
              <div style={s.pageTitle}>Incoming Donations</div>
              <div style={s.pageSub}>All donations received — click to view milestone details</div>
              {mockDonations.map((donation, i) => (
                <div key={i} style={s.card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💰</div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{donation.donor}</div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{donation.cause} · {donation.date}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>${donation.amount}</div>
                      <div style={{ fontSize: '11px', fontWeight: '500', color: statusConfig[donation.status].color, background: statusConfig[donation.status].bg, padding: '2px 8px', borderRadius: '20px', display: 'inline-block' }}>
                        {statusConfig[donation.status].label}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: '#F3F4F6', borderRadius: '4px', height: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{ width: `${(donation.milestones.filter(m => m.done).length / donation.milestones.length) * 100}%`, height: '100%', background: '#10B981', borderRadius: '4px' }}></div>
                  </div>

                  {/* Milestones */}
                  {donation.milestones.map((milestone, mi) => (
                    <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: mi < donation.milestones.length - 1 ? '12px' : '0' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: milestone.done ? '#10B981' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {milestone.done ? <span style={{ color: 'white', fontSize: '11px' }}>✓</span> : <span style={{ color: '#D1D5DB', fontSize: '10px' }}>○</span>}
                      </div>
                      <div style={{ flex: 1, fontSize: '13px', color: milestone.done ? '#111827' : '#9CA3AF', fontWeight: milestone.done ? '500' : '400' }}>{milestone.title}</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: milestone.done ? '#10B981' : '#D1D5DB' }}>${milestone.amount} {milestone.done ? '✓' : 'locked'}</div>
                    </div>
                  ))}

                  {!donation.milestones.every(m => m.done) && (
                    <button onClick={() => setActiveTab('upload')} style={{ marginTop: '16px', padding: '8px 18px', fontSize: '12px', fontWeight: '600', background: '#6366F1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      📸 Upload Proof to Unlock Funds
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {/* UPLOAD PROOF TAB */}
          {activeTab === 'upload' && (
            <>
              <div style={s.pageTitle}>Upload Milestone Proof</div>
              <div style={s.pageSub}>Submit verified proof to unlock your funds from escrow</div>

              {uploadSuccess && (
                <div style={s.successBanner}>
                  <span style={{ fontSize: '18px' }}>✅</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#065F46' }}>Proof submitted successfully!</div>
                    <div style={{ fontSize: '12px', color: '#059669' }}>AI is verifying your submission. Funds will be released within 24 hours.</div>
                  </div>
                </div>
              )}

              <div style={s.card}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>Milestone Details</div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={s.label}>Select Donation</label>
                  <select style={{ ...s.input }} onChange={e => setSelectedDonation(mockDonations.find(d => d.id === parseInt(e.target.value)))}>
                    <option value="">Choose a donation...</option>
                    {mockDonations.filter(d => d.status !== 'completed').map(d => (
                      <option key={d.id} value={d.id}>{d.donor} — ${d.amount} ({d.cause})</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={s.label}>Milestone Title</label>
                  <input value={milestoneTitle} onChange={e => setMilestoneTitle(e.target.value)} placeholder="e.g. Relief kits purchased and distributed" style={s.input}
                    onFocus={e => e.target.style.borderColor = '#6366F1'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={s.label}>Upload Photo Proof</label>
                  <div style={{ ...s.uploadBox, borderColor: uploadFile ? '#6366F1' : '#E5E7EB', background: uploadFile ? '#EEF2FF' : '#FAFAFA' }}
                    onClick={() => document.getElementById('photoInput').click()}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6366F1'}
                    onMouseLeave={e => !uploadFile && (e.currentTarget.style.borderColor = '#E5E7EB')}
                  >
                    <input id="photoInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files[0])} />
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>{uploadFile ? '📸' : '🖼️'}</div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: uploadFile ? '#6366F1' : '#374151', marginBottom: '4px' }}>
                      {uploadFile ? uploadFile.name : 'Click to upload photo'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{uploadFile ? 'File selected ✓' : 'JPG, PNG up to 10MB'}</div>
                  </div>
                </div>

                {/* Verification checklist */}
                <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>AI VERIFICATION CHECKS</div>
                  {[
                    { label: 'GPS metadata extracted from photo', done: !!uploadFile },
                    { label: 'Timestamp verified (after donation date)', done: !!uploadFile },
                    { label: 'AI authenticity scan', done: false },
                    { label: 'Blockchain hash recorded', done: false },
                  ].map((check, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < 3 ? '8px' : '0' }}>
                      <span style={{ fontSize: '13px', color: check.done ? '#10B981' : '#D1D5DB' }}>{check.done ? '✓' : '○'}</span>
                      <span style={{ fontSize: '12px', color: check.done ? '#065F46' : '#9CA3AF' }}>{check.label}</span>
                    </div>
                  ))}
                </div>

                <button onClick={handleUpload} disabled={uploading || !uploadFile || !milestoneTitle} style={{ ...s.uploadBtn, opacity: (!uploadFile || !milestoneTitle) ? 0.5 : 1, cursor: (!uploadFile || !milestoneTitle) ? 'not-allowed' : 'pointer' }}>
                  {uploading ? '⏳ Submitting proof...' : '📸 Submit Proof & Request Fund Release'}
                </button>
              </div>
            </>
          )}

          {/* MILESTONES TAB */}
          {activeTab === 'milestones' && (
            <>
              <div style={s.pageTitle}>Milestone Tracker</div>
              <div style={s.pageSub}>Track fund release progress across all your projects</div>
              {mockDonations.map((donation, di) => (
                <div key={di} style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{donation.cause}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>From {donation.donor} · {donation.date}</div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>${donation.amount}</div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    {donation.milestones.map((milestone, mi) => (
                      <div key={mi} style={{ display: 'flex', gap: '16px', marginBottom: mi < donation.milestones.length - 1 ? '20px' : '0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: milestone.done ? '#10B981' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: milestone.done ? 'none' : '1.5px solid #E5E7EB', flexShrink: 0 }}>
                            {milestone.done ? <span style={{ color: 'white', fontSize: '14px' }}>✓</span> : <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{mi + 1}</span>}
                          </div>
                          {mi < donation.milestones.length - 1 && (
                            <div style={{ width: '2px', flex: 1, background: milestone.done ? '#10B981' : '#F3F4F6', minHeight: '20px', marginTop: '4px' }}></div>
                          )}
                        </div>
                        <div style={{ flex: 1, paddingBottom: mi < donation.milestones.length - 1 ? '8px' : '0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: milestone.done ? '#111827' : '#9CA3AF' }}>{milestone.title}</div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: milestone.done ? '#10B981' : '#D1D5DB' }}>${milestone.amount} {milestone.done ? 'released ✓' : 'locked 🔒'}</div>
                          </div>
                          {!milestone.done && (
                            <button onClick={() => setActiveTab('upload')} style={{ marginTop: '6px', fontSize: '11px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontWeight: '500' }}>
                              Upload proof to unlock →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <>
              <div style={s.pageTitle}>NGO Settings</div>
              <div style={s.pageSub}>Manage your organization profile</div>
              <div style={s.card}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Organization Details</div>
                {[
                  { label: 'Name', value: user?.name || 'NGO Name' },
                  { label: 'Email', value: user?.email || 'ngo@example.com' },
                  { label: 'Role', value: 'NGO Organization' },
                  { label: 'Status', value: '✓ Verified by DonorTrace' },
                ].map((field, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? '1px solid #F9FAFB' : 'none' }}>
                    <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{field.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: field.label === 'Status' ? '#10B981' : '#111827' }}>{field.value}</span>
                  </div>
                ))}
                <button onClick={handleLogout} style={{ marginTop: '24px', padding: '10px 20px', fontSize: '13px', fontWeight: '500', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', cursor: 'pointer' }}>
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
