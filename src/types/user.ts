export interface User {
  _id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'moderator'
  avatar?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface UserSession {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}