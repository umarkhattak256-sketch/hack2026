import { useState } from 'react'

export default function ShowUpTodayBanner({ userSports, status, onRespond }) {
  const [askingDetails, setAskingDetails] = useState(false)
  const [selectedSports, setSelectedSports] = useState([])
  const [timeWindow, setTimeWindow] = useState('evening')

  const availableSportNames = userSports && userSports.length > 0 
    ? userSports.map(s => s.sport) 
    : ['Football', 'Running']

  // Pre-select primary sport or first one by default
  const handleYes = () => {
    const primarySportRow = userSports?.find(s => s.is_primary)
    const initialSport = primarySportRow ? primarySportRow.sport : availableSportNames[0]
    
    setSelectedSports([initialSport])
    setAskingDetails(true)
  }

  const toggleSport = (sport) => {
    if (selectedSports.includes(sport)) {
      if (selectedSports.length > 1) { // keep at least one
        setSelectedSports(selectedSports.filter(s => s !== sport))
      }
    } else {
      setSelectedSports([...selectedSports, sport])
    }
  }

  const handleConfirm = () => {
    onRespond(true, selectedSports, timeWindow)
  }

  const handleNo = () => {
    onRespond(false)
  }

  return (
    <section className="panel hero-panel">
      <div className="eyebrow">ShowUpToday?</div>
      
      {!askingDetails ? (
        <>
          <h1>Are you up for an activity today?</h1>
          <p>We'll match you into a nearby group using your sports profile.</p>
          <div className="availability-toggle">
            <button 
              className="primary-btn" 
              onClick={handleYes} 
              disabled={status === 'submitting' || status === 'loading'}
            >
              Yes, match me
            </button>
            <button 
              className="quiet-btn" 
              onClick={handleNo} 
              disabled={status === 'submitting' || status === 'loading'}
            >
              Not today
            </button>
          </div>
        </>
      ) : (
        <div className="showup-details form-grid">
          <h3>Which sports are you up for today?</h3>
          <div className="sport-chip-grid">
            {availableSportNames.map(sport => (
              <button
                key={sport}
                type="button"
                className={selectedSports.includes(sport) ? 'sport-chip active' : 'sport-chip'}
                onClick={() => toggleSport(sport)}
                style={{ marginBottom: '8px', marginRight: '8px', padding: '4px 12px', border: '1px solid #ccc', borderRadius: '16px', background: selectedSports.includes(sport) ? '#dcfce7' : 'transparent' }}
              >
                {sport}
              </button>
            ))}
          </div>

          <label style={{ marginTop: '16px', display: 'block' }}>When are you free?
            <select value={timeWindow} onChange={e => setTimeWindow(e.target.value)} style={{ marginLeft: '8px', padding: '4px' }}>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="18:00-21:00">18:00 - 21:00</option>
            </select>
          </label>

          <div style={{ marginTop: '16px' }}>
            <button 
              className="primary-btn" 
              onClick={handleConfirm}
              disabled={status === 'submitting'}
              style={{ marginRight: '8px' }}
            >
              {status === 'submitting' ? 'Confirming...' : 'Confirm Availability'}
            </button>
            <button 
               className="quiet-btn" 
               onClick={() => setAskingDetails(false)}
               disabled={status === 'submitting'}
            >
               Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
