
import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import BASE_API_URL from '../api'
import logo from './assets/ResearchHubLogo-1.png'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState(token ? 'verifying' : 'error')
  const [message, setMessage] = useState(
    token ? '' : 'Verification token is missing.'
  )

  const verificationStarted = useRef(false)

  useEffect(() => {
    if (!token || verificationStarted.current) return
    verificationStarted.current = true

    async function verifyEmail() {
      try {
        const response = await fetch(
          `${BASE_API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Email verification failed.')
        }

        setStatus('success')
        setMessage(data.message)
      } catch (error) {
        setStatus('error')
        setMessage(error.message)
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="verify-page">
      <div className="verify-card">

        <Link to="/" className="brand">
          <img src={logo} alt="ResearchHub Logo" className="brand-logo" />
          ResearchHub
        </Link>

        {status === 'verifying' && (
          <div className="verify-content">
            <div className="verify-spinner"></div>
            <h2>Verifying your email</h2>
            <p>Please wait while we confirm your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-content">
            <div className="verify-icon success-icon">✓</div>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <p className="verify-subtext">
              Your ResearchHub account is now ready to use.
            </p>
            <Link to="/login" className="verify-button">
              Continue to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-content">
            <div className="verify-icon error-icon">!</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <p className="verify-subtext">
              The link may have expired or already been used.
            </p>
            <Link to="/register" className="verify-button">
              Back to Registration
            </Link>
          </div>
        )}

        <p className="verify-footer">
          ResearchHub — Academic Research Repository
        </p>

      </div>
    </div>
  )
}

export default VerifyEmail
