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
      <button
        type="button"
        className="collapsible-header"
        onClick={toggle}
        aria-expanded={open}
      >
        <div>
          <strong>{title}</strong>
          {help && <div className="help mt-1">{help}</div>}
        </div>
        <div className="row gap-sm">
          {right}
          <span className="chevron" aria-hidden>▾</span>
        </div>
      </button>
      <div className="collapsible-body">
        <div>
          {open && <div className="collapsible-content">{children}</div>}
        </div>
      </div>
    </div>
  )
}
