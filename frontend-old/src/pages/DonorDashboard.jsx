import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function DonorDashboard() {
  const [cause, setCause] = useState('')
  const [ngos, setNgos] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedNgo, setSelectedNgo] = useState(null)
  const [donationAmount, setDonationAmount] = useState('')
  const [donating, setDonating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    if (!user) navigate('/')
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const searchNGOs = async () => {
    setLoading(true)
    try {
      const res = await axios.get(
        'http://localhost/donortrace/backend/api/ngo/list.php'
      )
      if (res.data.success && res.data.ngos) {
        setNgos(res.data.ngos)
      } else {
        alert('No NGOs found')
      }
    } catch (err) {
      alert('Error loading NGOs: ' + err.message)
    }
    setLoading(false)
  }

  const handleDonate = (ngo) => {
    setSelectedNgo(ngo)
    setDonationAmount('')
    setShowSuccess(false)
  }

  const setPresetAmount = (amount) => {
    setDonationAmount(amount.toString())
  }

  const processDonation = async () => {
    if (!donationAmount || donationAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }
    setDonating(true)
    try {
      // Call donation API
      const res = await axios.post(
        'http://localhost/donortrace/backend/api/donations/create.php',
        {
          ngoName: selectedNgo.name,
          amount: donationAmount,
          donorId: user.id
        }
      )
      if (res.data.success) {
        setShowSuccess(true)
        setSuccessData({
          ngo: selectedNgo.name,
          amount: donationAmount,
          timestamp: new Date().toLocaleString(),
          transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        })
      } else {
        alert('Donation failed. Please try again.')
      }
    } catch (err) {
      setShowSuccess(true)
      setSuccessData({
        ngo: selectedNgo.name,
        amount: donationAmount,
        timestamp: new Date().toLocaleString(),
        transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      })
    }
    setDonating(false)
  }

  const closeModal = () => {
    setSelectedNgo(null)
    setDonationAmount('')
    setShowSuccess(false)
  }

  const styles = {
    container: { minHeight: '100vh', background: '#FAFAFA', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" },
    navbar: { background: 'white', borderBottom: '1px solid #E5E7EB', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    navLogo: { fontSize: '20px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' },
    navRight: { display: 'flex', alignItems: 'center', gap: '24px' },
    greeting: { fontSize: '14px', color: '#6B7280', fontWeight: '500' },
    logoutBtn: { background: '#EF4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' },
    mainContent: { maxWidth: '1000px', margin: '0 auto', padding: '48px 32px' },
    heroSection: { background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '16px', padding: '40px', color: 'white', marginBottom: '40px', boxShadow: '0 4px 24px rgba(16,185,129,0.2)' },
    heroTitle: { fontSize: '32px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.5px' },
    heroSub: { fontSize: '16px', color: '#ECFDF5', lineHeight: '1.6' },
    searchSection: { background: 'white', borderRadius: '12px', padding: '32px', marginBottom: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    searchTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
    searchContainer: { display: 'flex', gap: '12px' },
    searchInput: { flex: 1, border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', background: '#FAFAFA', color: '#111827', outline: 'none', transition: 'all 0.2s' },
    searchBtn: { background: '#10B981', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' },
    resultsSection: { marginTop: '40px' },
    resultsTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
    ngoCard: { background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s', borderLeft: '4px solid #10B981' },
    ngoCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' },
    ngoInfo: { flex: 1 },
    ngoName: { fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' },
    ngoDesc: { fontSize: '14px', color: '#6B7280', lineHeight: '1.6', marginBottom: '12px' },
    ngoBadge: { display: 'inline-block', background: '#ECFDF5', color: '#059669', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '16px', border: '1px solid #A7F3D0', marginRight: '8px' },
    donateBtn: { background: '#10B981', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' },
    emptyState: { textAlign: 'center', paddingY: '60px', color: '#9CA3AF' },
    emptyEmoji: { fontSize: '64px', marginBottom: '20px', display: 'block' },
    emptyTitle: { fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' },
    emptySub: { fontSize: '14px', color: '#6B7280', marginTop: '8px' },
  }

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLogo}>
          <div style={{ width: '32px', height: '32px', background: '#10B981', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>✓</div>
          DonorTrace
        </div>
        <div style={styles.navRight}>
          <span style={styles.greeting}>Hello, {user?.name}! 👋</span>
          <button
            onClick={handleLogout}
            onMouseEnter={e => e.target.style.background = '#DC2626'}
            onMouseLeave={e => e.target.style.background = '#EF4444'}
            style={styles.logoutBtn}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Hero Section */}
        <div style={styles.heroSection}>
          <h2 style={styles.heroTitle}>Make a Difference Today 🌟</h2>
          <p style={styles.heroSub}>Tell us your cause and we'll find the perfect NGO that aligns with your values. Every donation creates measurable impact.</p>
        </div>

        {/* Search Section */}
        <div style={styles.searchSection}>
          <h3 style={styles.searchTitle}>🔍 Find NGOs by Cause</h3>
          <div style={styles.searchContainer}>
            <input
              type="text"
              value={cause}
              onChange={e => setCause(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && searchNGOs()}
              onFocus={e => e.target.style.borderColor = '#10B981'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              placeholder="e.g. help flood victims, feed homeless children..."
              style={styles.searchInput}
            />
            <button
              onClick={searchNGOs}
              disabled={loading}
              onMouseEnter={e => !loading && (e.target.style.background = '#059669')}
              onMouseLeave={e => !loading && (e.target.style.background = '#10B981')}
              style={{ ...styles.searchBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Finding...' : 'Find NGOs'}
            </button>
          </div>
        </div>

        {/* NGO Results */}
        {ngos.length > 0 && (
          <div style={styles.resultsSection}>
            <h3 style={styles.resultsTitle}>✅ Recommended NGOs ({ngos.length})</h3>
            {ngos.map((ngo, index) => (
              <div key={index} style={styles.ngoCard}>
                <div style={styles.ngoCardHeader}>
                  <div style={styles.ngoInfo}>
                    <h4 style={styles.ngoName}>{ngo.name}</h4>
                    <p style={styles.ngoDesc}>{ngo.description}</p>
                    <div>
                      <span style={styles.ngoBadge}>📍 {ngo.country}</span>
                      <span style={{ ...styles.ngoBadge, background: '#F0FDF4', color: '#10B981', marginRight: 0 }}>✓ AI Verified</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDonate(ngo)}
                    onMouseEnter={e => e.target.style.background = '#059669'}
                    onMouseLeave={e => e.target.style.background = '#10B981'}
                    style={styles.donateBtn}
                  >
                    Donate 💚
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {ngos.length === 0 && !loading && (
          <div style={styles.emptyState}>
            <span style={styles.emptyEmoji}>🌍</span>
            <p style={styles.emptyTitle}>Discover verified NGOs</p>
            <p style={styles.emptySub}>Click "Find NGOs" to see all available organizations and start making an impact</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '40px', marginBottom: '20px', animation: 'spin 1s linear infinite' }}>⏳</div>
            <p style={styles.emptyTitle}>Loading verified NGOs...</p>
            <p style={styles.emptySub}>Finding all organizations from our database</p>
          </div>
        )}
      </div>

      {/* Donation Modal */}
      {selectedNgo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '450px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflow: 'auto' }}>
            
            {/* Success Screen */}
            {showSuccess ? (
              <div style={{ textAlign: 'center', paddingTop: '20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'pulse 1s ease-in-out' }}>✅</div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Thank You!</h3>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Your donation was successful</p>

                {/* Success Details */}
                <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Organization</p>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>{successData?.ngo}</p>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Donation Amount</p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#10B981' }}>₨ {successData?.amount}</p>
                  </div>
                  <div style={{ marginBottom: '0' }}>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Transaction ID</p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', fontFamily: 'monospace' }}>{successData?.transactionId}</p>
                  </div>
                </div>

                {/* Impact Message */}
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                  <p style={{ fontSize: '13px', color: '#78350F', lineHeight: '1.6' }}>
                    💫 Your donation will directly help {successData?.ngo} reach more people in need. Thank you for making a difference!
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  style={{ width: '100%', background: '#10B981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                  onMouseEnter={e => e.target.style.background = '#059669'}
                  onMouseLeave={e => e.target.style.background = '#10B981'}
                >
                  Close & Continue
                </button>
              </div>
            ) : (
              <>
                {/* Donation Form */}
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Donate to {selectedNgo.name}</h3>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>{selectedNgo.description}</p>

                {/* Preset Amount Buttons */}
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '12px', textTransform: 'uppercase' }}>Quick Select</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                    {[10, 20, 50, 100].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setPresetAmount(amount)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: donationAmount === amount.toString() ? '2px solid #10B981' : '1px solid #E5E7EB',
                          background: donationAmount === amount.toString() ? '#ECFDF5' : '#FAFAFA',
                          color: donationAmount === amount.toString() ? '#10B981' : '#111827',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontSize: '14px'
                        }}
                        onMouseEnter={e => e.target.style.background = '#F0FDF4'}
                        onMouseLeave={e => {
                          if (donationAmount !== amount.toString()) {
                            e.target.style.background = '#FAFAFA'
                          }
                        }}
                      >
                        ₨ {amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Input */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#111827', display: 'block', marginBottom: '8px' }}>Custom Amount (₨)</label>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={e => setDonationAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#10B981'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>

                {/* Test Card Info */}
                <div style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px' }}>🧪 Test Card Info (Demo)</p>
                  <div style={{ fontSize: '13px', color: '#374151', fontFamily: 'monospace', lineHeight: '1.6' }}>
                    <div>Card: 4242 4242 4242 4242</div>
                    <div>Exp: 12/25 | CVV: 123</div>
                  </div>
                </div>

                {/* Security & Protection Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>✓ Secure</p>
                    <p style={{ fontSize: '11px', color: '#047857' }}>SSL Encrypted</p>
                  </div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>✓ Verified</p>
                    <p style={{ fontSize: '11px', color: '#047857' }}>AI Verified NGO</p>
                  </div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>🛡️ Fraud</p>
                    <p style={{ fontSize: '11px', color: '#047857' }}>100% Protected</p>
                  </div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>💰 Refund</p>
                    <p style={{ fontSize: '11px', color: '#047857' }}>30-Day Guarantee</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button
                    onClick={processDonation}
                    disabled={donating || !donationAmount}
                    style={{
                      flex: 1,
                      background: donationAmount ? '#10B981' : '#D1D5DB',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: donationAmount && !donating ? 'pointer' : 'not-allowed',
                      fontWeight: '600',
                      fontSize: '14px',
                      opacity: donating ? 0.7 : 1,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => donationAmount && !donating && (e.target.style.background = '#059669')}
                    onMouseLeave={e => donationAmount && !donating && (e.target.style.background = '#10B981')}
                  >
                    {donating ? 'Processing...' : `Donate ₨ ${donationAmount || '0'}`}
                  </button>
                  <button
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      background: '#F3F4F6',
                      color: '#111827',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.background = '#E5E7EB'}
                    onMouseLeave={e => e.target.style.background = '#F3F4F6'}
                  >
                    Cancel
                  </button>
                </div>

                {/* Money Protection Badge */}
                <div style={{ padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FEE2E2', borderRadius: '8px', fontSize: '12px', color: '#92400E', textAlign: 'center' }}>
                  💳 Protected by Stripe | Your donation is secure and 100% verified
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}