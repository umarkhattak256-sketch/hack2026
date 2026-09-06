import { useState } from 'react'

export default function Collapsible({
  title,
  help,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  right = null,
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = typeof controlledOpen === 'boolean'
  const open = isControlled ? controlledOpen : internalOpen

  const toggle = () => {
    if (onToggle) onToggle(!open)
    if (!isControlled) setInternalOpen(prev => !prev)
  }

  return (
    <div className={`collapsible ${open ? 'open' : ''}`}>
      <div className="collapsible-header">
        <button
          type="button"
          className="collapsible-toggle"
          onClick={toggle}
          aria-expanded={open}
        >
          <div>
            <strong>{title}</strong>
            {help && <div className="help mt-1">{help}</div>}
          </div>
        </button>
        <div className="collapsible-actions">
          {right}
          <button
            type="button"
            className="collapsible-chevron"
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? 'Collapse section' : 'Expand section'}
          >
            <span className="chevron" aria-hidden>v</span>
          </button>
        </div>
      </div>
      <div className="collapsible-body">
        <div>
          {open && <div className="collapsible-content">{children}</div>}
        </div>
      </div>
    </div>
  )
}
