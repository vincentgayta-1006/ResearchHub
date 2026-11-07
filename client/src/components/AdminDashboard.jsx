import BASE_API_URL from '../api'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user'))

  const [activeSection, setActiveSection] = useState('overview')

  // Dashboard statistics states
  const [statistics, setStatistics] = useState({
    totalResearch: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalResearchers: 0,
  })

  const [statisticsLoading, setStatisticsLoading] = useState(false)
  const [statisticsError, setStatisticsError] = useState('')

  // Research states
  const [research, setResearch] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Upload states
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')

  // Edit states
  const [editingResearch, setEditingResearch] = useState(null)
  const [updating, setUpdating] = useState(false)

  // User management states
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [usersMessage, setUsersMessage] = useState('')

  // Fetch dashboard statistics
  useEffect(() => {
    if (activeSection !== 'overview') return

    const fetchStatistics = async () => {
      try {
        setStatisticsLoading(true)
        setStatisticsError('')

        const token = localStorage.getItem('token')

        const [researchResponse, usersResponse] = await Promise.all([
          fetch(`${BASE_API_URL}/api/research?limit=50`),
          fetch(`${BASE_API_URL}/api/auth/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        const researchData = await researchResponse.json()
        const usersData = await usersResponse.json()

        if (!researchResponse.ok) {
          throw new Error(
            researchData.message || 'Failed to fetch research statistics.'
          )
        }

        if (!usersResponse.ok) {
          throw new Error(
            usersData.message || 'Failed to fetch user statistics.'
          )
        }

        const registeredUsers = usersData.users || []

        setStatistics({
          totalResearch: researchData.totalCount || 0,
          totalUsers: registeredUsers.length,
          totalStudents: registeredUsers.filter(
            (user) => user.role === 'student'
          ).length,
          totalResearchers: registeredUsers.filter(
            (user) => user.role === 'researcher'
          ).length,
        })

      } catch (error) {
        setStatisticsError(error.message)
      } finally {
        setStatisticsLoading(false)
      }
    }

    fetchStatistics()
  }, [activeSection])

  // Fetch research papers
  useEffect(() => {
    if (activeSection !== 'research') return

    const fetchResearch = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${BASE_API_URL}/api/research?limit=50`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Failed to fetch research papers.'
          )
        }

        setResearch(data.research)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchResearch()
  }, [activeSection])

  // Fetch registered users
  useEffect(() => {
    if (activeSection !== 'users') return

    const fetchUsers = async () => {
      try {
        setUsersLoading(true)
        setUsersError('')

        const token = localStorage.getItem('token')

        const response = await fetch(
          `${BASE_API_URL}/api/auth/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Failed to fetch users.'
          )
        }

        setUsers(data.users)
      } catch (error) {
        setUsersError(error.message)
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [activeSection])

  // Upload research paper
  const handleUpload = async (event) => {
    event.preventDefault()

    try {
      setUploading(true)
      setUploadMessage('')
      setUploadError('')

      const formData = new FormData(event.target)
      const token = localStorage.getItem('token')

      const response = await fetch(
        	`${BASE_API_URL}/api/research`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to upload research.'
        )
      }

      setResearch((prev) => [data.research, ...prev])

      setUploadMessage(
        'Research paper uploaded successfully!'
      )

      event.target.reset()
      setShowUploadForm(false)

    } catch (error) {
      setUploadError(error.message)
    } finally {
      setUploading(false)
    }
  }

  // Delete research paper
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this research paper?'
    )

    if (!confirmDelete) return

    try {
      const token = localStorage.getItem('token')

      const response = await fetch(
        `${BASE_API_URL}/api/research/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete research paper.'
        )
      }

      setResearch((prev) =>
        prev.filter((paper) => paper._id !== id)
      )

      setUploadMessage(
        'Research paper deleted successfully!'
      )

      setUploadError('')

    } catch (error) {
      setUploadError(error.message)
    }
  }

  // Update research paper
  const handleUpdate = async (event) => {
    event.preventDefault()

    try {
      setUpdating(true)
      setUploadMessage('')
      setUploadError('')

      const formData = new FormData(event.target)
      const token = localStorage.getItem('token')

      const response = await fetch(
        `${BASE_API_URL}/api/research/${editingResearch._id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to update research.'
        )
      }

      setResearch((prev) =>
        prev.map((paper) =>
          paper._id === editingResearch._id
            ? data.research
            : paper
        )
      )

      setUploadMessage(
        'Research paper updated successfully!'
      )

      setEditingResearch(null)

    } catch (error) {
      setUploadError(error.message)
    } finally {
      setUpdating(false)
    }
  }

  // Delete registered user
  const handleDeleteUser = async (id, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the account of ${name}?`
    )

    if (!confirmDelete) return

    try {
      setUsersMessage('')
      setUsersError('')

      const token = localStorage.getItem('token')

      const response = await fetch(
        	`${BASE_API_URL}/api/auth/users/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete user.'
        )
      }

      setUsers((prev) =>
        prev.filter((registeredUser) => registeredUser._id !== id)
      )

      setUsersMessage('User deleted successfully!')

    } catch (error) {
      setUsersError(error.message)
    }
  }

  return (
    <div className="app">

      {/* NAVIGATION */}
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">R</span>
          ResearchHub
        </Link>

        <div>
          <span>Admin: {user?.name}</span>
          {' '}
          <Link to="/" className="btn-login">
            Back to Homepage
          </Link>
        </div>
      </header>

      <main className="about-section">

        {/* DASHBOARD HEADER */}
        <span className="eyebrow">ADMINISTRATION</span>

        <h2>Admin Dashboard</h2>

        <p>
          Welcome back, {user?.name}!
          Manage ResearchHub from this dashboard.
        </p>

        {/* DASHBOARD OVERVIEW */}
        {activeSection === 'overview' && (
          <div className="admin-dashboard-grid">

            {/* RESEARCH MANAGEMENT CARD */}
            <div className="admin-dashboard-card">
              <h3>Research Management</h3>


              <p>
                Upload, view, edit, and delete research papers.
              </p>

              <button
                onClick={() => {
                  setActiveSection('research')
                  setUploadMessage('')
                  setUploadError('')
                }}
              >
                Manage Research
              </button>
            </div>

            {/* USER MANAGEMENT CARD */}
            <div className="admin-dashboard-card">
              <h3>User Management</h3>

              <p>
                View and manage registered ResearchHub users.
              </p>

              <button
                onClick={() => {
                  setActiveSection('users')
                  setUsersMessage('')
                  setUsersError('')
                }}
              >
                Manage Users
              </button>
            </div>

            {/* DASHBOARD STATISTICS */}
            <div className="admin-dashboard-card">
              <h3>Dashboard Statistics</h3>

              {statisticsLoading && <p>Loading statistics...</p>}

              {statisticsError && <p>{statisticsError}</p>}

              {!statisticsLoading && !statisticsError && (
                <div>
                  <p>
                    Total Research Papers: {statistics.totalResearch}
                  </p>

                  <p>
                    Total Users: {statistics.totalUsers}
                  </p>

                  <p>
                    Students: {statistics.totalStudents}
                  </p>

                  <p>
                    Researchers: {statistics.totalResearchers}
                  </p>
                </div>
              )}
            </div>


          </div>
        )}

        {/* RESEARCH MANAGEMENT SECTION */}
        {activeSection === 'research' && (
          <section className="admin-management-section">

            <h2>Research Management</h2>

            <p>
              Manage all research papers uploaded to ResearchHub.
            </p>

            {/* UPLOAD BUTTON */}
            <button
              onClick={() => {
                setShowUploadForm(!showUploadForm)
                setEditingResearch(null)
                setUploadMessage('')
                setUploadError('')
              }}
            >
              {showUploadForm
                ? 'Cancel Upload'
                : 'Add Research Paper'}
            </button>

            {uploadMessage && <p>{uploadMessage}</p>}
            {uploadError && <p>{uploadError}</p>}

            {/* UPLOAD FORM */}
            {showUploadForm && (
              <form
                onSubmit={handleUpload}
                className="admin-upload-form"
              >
                <label>Research Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter research title"
                  required
                />

                <label>Authors</label>
                <input
                  type="text"
                  name="authors"
                  placeholder="Separate authors with commas"
                  required
                />

                <label>Abstract</label>
                <textarea
                  name="abstract"
                  placeholder="Enter research abstract"
                  required
                />

                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  placeholder="e.g. Computer Science"
                  required
                />

                <label>Keywords</label>
                <input
                  type="text"
                  name="keywords"
                  placeholder="Separate keywords with commas"
                />

                <label>Publication Year</label>
                <input
                  type="number"
                  name="year"
                  placeholder="e.g. 2026"
                  required
                />

                <label>Research PDF</label>
                <input
                  type="file"
                  name="pdf"
                  accept="application/pdf,.pdf"
                  required
                />

                <button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Research'}
                </button>
              </form>
            )}

            {/* EDIT FORM */}
            {editingResearch && (
              <form
                onSubmit={handleUpdate}
                className="admin-upload-form"
              >
                <h3>Edit Research Paper</h3>

                <label>Research Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingResearch.title}
                  required
                />

                <label>Authors</label>
                <input
                  type="text"
                  name="authors"
                  defaultValue={editingResearch.authors.join(', ')}
                  required
                />

                <label>Abstract</label>
                <textarea
                  name="abstract"
                  defaultValue={editingResearch.abstract}
                  required
                />

                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  defaultValue={editingResearch.category}
                  required
                />

                <label>Keywords</label>
                <input
                  type="text"
                  name="keywords"
                  defaultValue={editingResearch.keywords?.join(', ')}
                />

                <label>Publication Year</label>
                <input
                  type="number"
                  name="year"
                  defaultValue={editingResearch.year}
                  required
                />

                <label>Replace Research PDF (Optional)</label>
                <input
                  type="file"
                  name="pdf"
                  accept="application/pdf,.pdf"
                />

                <button type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingResearch(null)}
                >
                  Cancel
                </button>
              </form>
            )}

            {/* BACK BUTTON */}
            <button
              onClick={() => {
                setActiveSection('overview')
                setShowUploadForm(false)
                setEditingResearch(null)
                setUploadMessage('')
                setUploadError('')
              }}
            >
              Back to Dashboard
            </button>

            {loading && <p>Loading research papers...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && research.length === 0 && (
              <p>No research papers found.</p>
            )}

            {/* RESEARCH TABLE */}
            {!loading && !error && research.length > 0 && (
              <div className="admin-research-list">

                <h3>
                  Research Papers ({research.length})
                </h3>

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Year</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {research.map((paper) => (
                        <tr key={paper._id}>
                          <td>{paper.title}</td>
                          <td>{paper.category}</td>
                          <td>{paper.year}</td>

                          <td>
                            <Link to={`/research/${paper._id}`}>
                              View
                            </Link>
                            {' '}

                            <button
                              onClick={() => {
                                setEditingResearch(paper)
                                setShowUploadForm(false)
                                setUploadMessage('')
                                setUploadError('')
                              }}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(paper._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </section>
        )}

        {/* USER MANAGEMENT SECTION */}
        {activeSection === 'users' && (
          <section className="admin-management-section">

            <h2>User Management</h2>

            <p>
              View and manage registered ResearchHub users.
            </p>

            {/* SUCCESS AND ERROR MESSAGES */}
            {usersMessage && <p>{usersMessage}</p>}
            {usersError && <p>{usersError}</p>}

            {/* BACK BUTTON */}
            <button
              onClick={() => {
                setActiveSection('overview')
                setUsersMessage('')
                setUsersError('')
              }}
            >
              Back to Dashboard
            </button>

            {/* LOADING */}
            {usersLoading && <p>Loading users...</p>}

            {/* EMPTY STATE */}
            {!usersLoading && !usersError && users.length === 0 && (
              <p>No registered users found.</p>
            )}

            {/* USERS TABLE */}
            {!usersLoading && !usersError && users.length > 0 && (
              <div className="admin-research-list">

                <h3>
                  Registered Users ({users.length})
                </h3>

                <div className="admin-table-wrapper">

                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Date Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((registeredUser) => (
                        <tr key={registeredUser._id}>

                          <td>{registeredUser.name}</td>

                          <td>{registeredUser.email}</td>

                          <td>
                            {registeredUser.role}
                          </td>

                          <td>
                            {new Date(
                              registeredUser.createdAt
                            ).toLocaleDateString()}
                          </td>

                          <td>
                            <button
                              onClick={() =>
                                handleDeleteUser(
                                  registeredUser._id,
                                  registeredUser.name
                                )
                              }
                            >
                              Delete
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>

                  </table>

                </div>
              </div>
            )}

          </section>
        )}

      </main>
    </div>
  )
}

export default AdminDashboard
