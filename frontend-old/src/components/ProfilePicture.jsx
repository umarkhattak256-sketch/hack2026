import { useRef, useState } from 'react'
import axios from 'axios'

export default function ProfilePicture({ user, imageUrl, onUploaded }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const initials = (user?.name || 'User')
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
    onUploaded(previewUrl, true)

    try {
      const formData = new FormData()
      formData.append('user_id', user.id)
      formData.append('profile_picture', file)

      const response = await axios.post('/api/profile/upload-pic.php', formData)
      if (response.data.success) {
        onUploaded(response.data.url)
      } else {
        setError(response.data.message || 'Upload failed')
      }
    } catch (err) {
      console.error('Profile picture upload failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setError('Could not upload image')
    } finally {
      setUploading(false)
      URL.revokeObjectURL(previewUrl)
    }
  }

  return (
    <div className="profile-picture">
      <button
        type="button"
        className="profile-picture-drop"
        onClick={() => inputRef.current?.click()}
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault()
          uploadFile(event.dataTransfer.files?.[0])
        }}
      >
        {imageUrl ? <img src={imageUrl} alt={`${user?.name || 'User'} profile`} /> : <span>{initials}</span>}
      </button>
      <div>
        <strong>{user?.name || 'Your profile'}</strong>
        <span>{uploading ? 'Uploading...' : 'Drop or click to upload JPG, PNG, WEBP'}</span>
        {error && <small>{error}</small>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={event => uploadFile(event.target.files?.[0])}
      />
    </div>
  )
}
