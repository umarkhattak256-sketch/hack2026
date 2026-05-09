import { useRef, useState } from 'react'
import api from '../services/api'

export default function ProfilePicture({ user, imageUrl, onUploaded }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [hover, setHover] = useState(false)

  const initials = (user?.name || 'You')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const uploadFile = async file => {
    if (!file || !user?.id) return
    setUploading(true)
    setError('')

    const previewUrl = URL.createObjectURL(file)
    onUploaded?.(previewUrl, true)

    try {
      const formData = new FormData()
      formData.append('user_id', user.id)
      formData.append('profile_picture', file)

      const response = await api.post('/profile/upload-pic.php', formData)
      if (response.data.success) {
        onUploaded?.(response.data.url)
      } else {
        setError(response.data.message || 'Upload failed')
      }
    } catch (err) {
      setError('Could not upload image')
    } finally {
      setUploading(false)
      URL.revokeObjectURL(previewUrl)
    }
  }

  return (
    <div className="avatar-stack">
      <button
        type="button"
        className="avatar-drop"
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          uploadFile(e.dataTransfer.files?.[0])
        }}
        aria-label="Upload profile picture"
      >
        {imageUrl
          ? <img src={imageUrl} alt={`${user?.name || 'Profile'}`} />
          : <span>{initials}</span>}
        <span className="upload-hint" aria-hidden>{uploading ? 'Uploading…' : 'Change photo'}</span>
      </button>
      <div className="avatar-meta">
        <strong>{user?.name || 'Your profile'}</strong>
        <span>{uploading ? 'Uploading...' : 'Drop or tap to upload — JPG, PNG, WEBP up to 5 MB'}</span>
        {error && <small>{error}</small>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={e => uploadFile(e.target.files?.[0])}
      />
    </div>
  )
}
