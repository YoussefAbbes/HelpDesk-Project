/**
 * ProfilePage — user profile with avatar upload and basic info editing.
 */

import React, { useState } from 'react'
import { User, Mail, Briefcase, Camera, Save } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import Button from '../components/ui/Button'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    department: user?.department || '',
    bio: user?.bio || '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update profile data
      const updateData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        updateData.append(key, value)
      })
      if (avatarFile) {
        updateData.append('avatar', avatarFile)
      }

      const { data } = await api.patch('/users/me/', updateData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUser(data)
      setIsEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const avatarUrl = avatarPreview || user?.avatar || null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Profile
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your account information
        </p>
      </div>

      {/* Avatar section */}
      <div className="card mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 dark:border-primary-900"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-primary-100 dark:border-primary-900">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            {isEditing && (
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-dark-border rounded-full cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {user?.username}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Personal Information
          </h3>
          {!isEditing ? (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    first_name: user?.first_name || '',
                    last_name: user?.last_name || '',
                    email: user?.email || '',
                    department: user?.department || '',
                    bio: user?.bio || '',
                  })
                  setAvatarFile(null)
                  setAvatarPreview(null)
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Enter first name"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">
                {user?.first_name || '—'}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Enter last name"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">
                {user?.last_name || '—'}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Enter email"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">
                {user?.email || '—'}
              </p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Department
            </label>
            {isEditing ? (
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="Enter department"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">
                {user?.department || '—'}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="input w-full"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {user?.bio || '—'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
