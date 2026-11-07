import BASE_API_URL from '../api'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = `${BASE_API_URL}/api/auth`

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)

      let response

      try {
        response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
          }),
        })
      } catch {
        throw new Error(
          'Unable to connect to the server. Please try again.'
        )
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('This email address is already registered.')
        }

        throw new Error(
          data.message || 'Registration failed. Please try again.'
        )
      }

      navigate('/login', {
        state: {
          successMessage: 'Registration successful! You can now log in.',
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand">
          <span className="brand-icon">R</span>
          ResearchHub
        </Link>

        <h1>Create an account</h1>
        <p>Join ResearchHub and explore academic research.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>

          <div className="password-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password (minimum 8 characters)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />

            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <label htmlFor="confirmPassword">Confirm Password</label>

          <div className="password-wrapper">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />

            <button
              type="button"
              className="password-toggle"
              aria-label={
                showConfirmPassword ? 'Hide password' : 'Show password'
              }
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {confirmPassword.length > 0 && (
            <p
              className={`password-feedback ${
                passwordsMatch ? 'match' : 'no-match'
              }`}
            >
              {passwordsMatch
                ? '✓ Passwords match'
                : '✕ Passwords do not match'}
            </p>
          )}

          {error && <p className="auth-error">{error}</p>}

          <label htmlFor="role">Account Type</label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="student">Student</option>
            <option value="researcher">Researcher</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
