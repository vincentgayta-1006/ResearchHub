import BASE_API_URL from '../api'
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const API_URL = `${BASE_API_URL}/api/auth`

function Login() {
  const navigate = useNavigate()

  const location = useLocation()
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (successMessage) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [successMessage, navigate, location.pathname])

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setLoading(true)
      setError('')

      let response

      try {
        response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })
      } catch {
        throw new Error('Unable to connect to the server. Please try again.')
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Incorrect email or password.')
        }

        throw new Error(data.message || 'Login failed. Please try again.')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      navigate('/', {
        state: {
          successMessage: `Welcome back, ${data.user.name}!`,
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

        <h1>Welcome back</h1>
        <p>Log in to your ResearchHub account.</p>

        {successMessage && (
          <p className="auth-success">{successMessage}</p>
        )}

        <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
