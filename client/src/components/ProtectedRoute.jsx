
import { Navigate, Outlet, useLocation } from 'react-router-dom'

function ProtectedRoute({ allowedRoles }) {
  const location = useLocation()

  const token = localStorage.getItem('token')
  const savedUser = localStorage.getItem('user')

  let user = null

  try {
    user = savedUser ? JSON.parse(savedUser) : null
  } catch {
    user = null
  }

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
