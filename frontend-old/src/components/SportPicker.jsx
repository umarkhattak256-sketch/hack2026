const availableSports = ['Football', 'Basketball', 'Tennis', 'Running', 'Volleyball', 'Padel']
const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro']

export default function SportPicker({ sports, onChange }) {
  const selected = sports.length > 0 ? sports : [{ sport: 'Football', skill: 'Intermediate', is_primary: true }]
  const selectedNames = selected.map(item => item.sport)

  const toggleSport = sport => {
    if (selectedNames.includes(sport)) {
      const next = selected.filter(item => item.sport !== sport)
      if (next.length === 0) return
      if (!next.some(item => item.is_primary)) {
        next[0] = { ...next[0], is_primary: true }
      }
      onChange(next)
      return
    }

    onChange([
      ...selected,
      { sport, skill: 'Intermediate', is_primary: selected.length === 0 },
    ])
  }

  const updateSkill = (sport, skill) => {
    onChange(selected.map(item => item.sport === sport ? { ...item, skill } : item))
  }

  const setPrimary = sport => {
    onChange(selected.map(item => ({ ...item, is_primary: item.sport === sport })))
  }

  return (
    <div className="sport-picker">
      <div className="sport-chip-grid">
        {availableSports.map(sport => (
          <button
            key={sport}
            type="button"
            className={selectedNames.includes(sport) ? 'sport-chip active' : 'sport-chip'}
            onClick={() => toggleSport(sport)}
          >
            {sport}
          </button>
        ))}
      </div>

      <div className="sport-interest-list">
        {selected.map(item => (
          <div className="sport-interest-row" key={item.sport}>
            <button
              type="button"
              className={item.is_primary ? 'star-btn active' : 'star-btn'}
              title="Set as primary sport"
              onClick={() => setPrimary(item.sport)}
            >
              ★
            </button>
            <strong>{item.sport}</strong>
            <select value={item.skill} onChange={event => updateSkill(item.sport, event.target.value)}>
              {skillLevels.map(skill => <option key={skill}>{skill}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
