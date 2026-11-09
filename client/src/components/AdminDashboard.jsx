
import BASE_API_URL from '../api'
import { Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import logo from '../assets/ResearchHubLogo-1.png'

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

  // Research search and filter states
  const [researchSearchInput, setResearchSearchInput] = useState('')
  const [researchSearch, setResearchSearch] = useState('')

  const [researchCategoryFilter, setResearchCategoryFilter] = useState('')
  const [appliedResearchCategory, setAppliedResearchCategory] = useState('')

  // Upload states
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')

  // Edit states
  const [editingResearch, setEditingResearch] = useState(null)
  const [updating, setUpdating] = useState(false)
  const editSectionRef = useRef(null)

  // Research deletion modal states
  const [researchToDelete, setResearchToDelete] = useState(null)
  const [deletingResearch, setDeletingResearch] = useState(false)

  // User management states
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [usersMessage, setUsersMessage] = useState('')

  // User deletion modal states
  const [userToDelete, setUserToDelete] = useState(null)
  const [deletingUser, setDeletingUser] = useState(false)

  const [userDeleteSuccess, setUserDeleteSuccess] = useState('')

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

  // Automatically hide success notification after 3 seconds
  useEffect(() => {
    if (!userDeleteSuccess) return

    const timer = setTimeout(() => {
      setUserDeleteSuccess('')
    }, 3000)

    return () => clearTimeout(timer)
  }, [userDeleteSuccess])

  // Automatically hide research success notification after 3 seconds
  useEffect(() => {
    if (!uploadMessage) return

    const timer = setTimeout(() => {
      setUploadMessage('')
    }, 3000)

    return () => clearTimeout(timer)
  }, [uploadMessage])

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

  // Automatically scroll to edit form when editing a research paper
  useEffect(() => {
    if (editingResearch && editSectionRef.current) {
      editSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [editingResearch])

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

  // Open research deletion confirmation modal
  const handleDelete = (id, title) => {
    setResearchToDelete({ id, title })
  }

  // Confirm research deletion
  const confirmDeleteResearch = async () => {
    if (!researchToDelete) return

    try {
      setDeletingResearch(true)
      setUploadError('')
      setUploadMessage('')

      const token = localStorage.getItem('token')

      const response = await fetch(
        `${BASE_API_URL}/api/research/${researchToDelete.id}`,
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
        prev.filter(
          (paper) => paper._id !== researchToDelete.id
        )
      )

      setUploadMessage(
        `"${researchToDelete.title}" was deleted successfully.`
      )

      setResearchToDelete(null)

    } catch (error) {
      setUploadError(error.message)
    } finally {
      setDeletingResearch(false)
    }
  }

  // Open user deletion confirmation modal
  const handleDeleteUser = (id, name) => {
    setUserToDelete({ id, name })
  }

  // Confirm user deletion
  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setDeletingUser(true)
      setUsersError('')
      setUsersMessage('')
      setUserDeleteSuccess('')

      const token = localStorage.getItem('token')

      const response = await fetch(
        `${BASE_API_URL}/api/auth/users/${userToDelete.id}`,
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

      // Remove deleted user from the table
      setUsers((prev) =>
        prev.filter(
          (registeredUser) =>
            registeredUser._id !== userToDelete.id
        )
      )

      // Show success notification
      setUserDeleteSuccess(
        `${userToDelete.name} was deleted successfully.`
      )

      // Close confirmation modal
      setUserToDelete(null)

    } catch (error) {
      setUsersError(error.message)
    } finally {
      setDeletingUser(false)
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

  // Get available research categories
  const researchCategories = [
    ...new Set(
      research
        .map((paper) => paper.category)
        .filter(Boolean)
    ),
  ].sort()

  // Filter research papers
  const filteredResearch = research.filter((paper) => {
    const authorsText = Array.isArray(paper.authors)
      ? paper.authors.join(' ')
      : paper.authors || ''

    const keywordsText = Array.isArray(paper.keywords)
      ? paper.keywords.join(' ')
      : paper.keywords || ''

    const searchableText = [
      paper.title,
      authorsText,
      paper.category,
      keywordsText,
      paper.year,
    ]
      .join(' ')
      .toLowerCase()

    const matchesSearch = searchableText.includes(
      researchSearch.toLowerCase()
    )

    const matchesCategory =
      !appliedResearchCategory ||
      paper.category === appliedResearchCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="app">

      {/* NAVIGATION */}
      <header className="navbar">
        <Link to="/" className="brand">
                <img src={logo} alt="ResearchHub Logo" className="brand-logo" />
                ResearchHub
        </Link>

        <div className="admin-nav-actions">
          <span>Admin: {user?.name}</span>

          <Link to="/" className="btn-login">
            Back to Homepage
          </Link>
        </div>
      </header>

      <main className="about-section admin-page-container">

        {/* USER DELETION SUCCESS ALERT */}
        {userDeleteSuccess && (
          <div className="toast-notification admin-toast-fade">
            <span className="toast-icon">✓</span>

            <span className="toast-message">
              {userDeleteSuccess}
            </span>

            <button
              type="button"
              onClick={() => setUserDeleteSuccess('')}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        )}

        {/* DASHBOARD HEADER */}
        <span className="eyebrow">ADMINISTRATION</span>

        <h2>Admin Dashboard</h2>

        <p>
          Welcome back, {user?.name}!
          Manage ResearchHub from this dashboard.
        </p>

        {/* DASHBOARD OVERVIEW */}
        {activeSection === 'overview' && (
          <div className="admin-overview">

            {/* DASHBOARD STATISTICS */}
            <section className="statistics-section">
              <div className="statistics-heading">
                <div>
                  <span className="eyebrow">AT A GLANCE</span>
                  <h3>Dashboard Statistics</h3>
                  <p className="statistics-description">
                    Overview of ResearchHub's registered content and users.
                  </p>
                </div>
              </div>

              {statisticsLoading && (
                <p className="statistics-status">
                  Loading statistics...
                </p>
              )}

              {statisticsError && (
                <p className="statistics-error">
                  {statisticsError}
                </p>
              )}

              {!statisticsLoading && !statisticsError && (
                <div className="statistics-grid">

                  <div className="stat-card stat-research">
                    <div className="stat-card-top">
                      <span className="stat-icon">📚</span>
                      <span className="stat-label">RESEARCH PAPERS</span>
                    </div>
                    <h2>{statistics.totalResearch}</h2>
                    <p>Total research papers</p>
                  </div>

                  <div className="stat-card stat-users">
                    <div className="stat-card-top">
                      <span className="stat-icon">👥</span>
                      <span className="stat-label">TOTAL USERS</span>
                    </div>
                    <h2>{statistics.totalUsers}</h2>
                    <p>Registered accounts</p>
                  </div>

                  <div className="stat-card stat-students">
                    <div className="stat-card-top">
                      <span className="stat-icon">🎓</span>
                      <span className="stat-label">STUDENTS</span>
                    </div>
                    <h2>{statistics.totalStudents}</h2>
                    <p>Registered students</p>
                  </div>

                  <div className="stat-card stat-researchers">
                    <div className="stat-card-top">
                      <span className="stat-icon">🔬</span>
                      <span className="stat-label">RESEARCHERS</span>
                    </div>
                    <h2>{statistics.totalResearchers}</h2>
                    <p>Registered researchers</p>
                  </div>

                </div>
              )}
            </section>

            {/* MANAGEMENT CARDS */}
            <section className="management-section">
              <div className="statistics-heading">
                <div>
                  <span className="eyebrow">ADMIN TOOLS</span>
                  <h3>Management</h3>
                  <p className="statistics-description">
                    Manage the content and accounts in ResearchHub.
                  </p>
                </div>
              </div>

              <div className="management-grid">

                <div className="admin-dashboard-card">
                  <div className="management-icon">📄</div>
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
                    Manage Research →
                  </button>
                </div>

                <div className="admin-dashboard-card">
                  <div className="management-icon">👤</div>
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
                    Manage Users →
                  </button>
                </div>

              </div>
            </section>

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

            {/* RESEARCH SUCCESS ALERT */}
            {uploadMessage && (
              <div className="toast-notification admin-toast-fade">
                <span className="toast-icon">✓</span>

                <span className="toast-message">
                  {uploadMessage}
                </span>

                <button
                  type="button"
                  onClick={() => setUploadMessage('')}
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            )}

            {/* RESEARCH ERROR ALERT */}
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
                ref={editSectionRef}
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
                  defaultValue={
                    Array.isArray(editingResearch.authors)
                      ? editingResearch.authors.join(', ')
                      : editingResearch.authors
                  }
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
                  defaultValue={
                    Array.isArray(editingResearch.keywords)
                      ? editingResearch.keywords.join(', ')
                      : editingResearch.keywords || ''
                  }
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
                setResearchSearchInput('')
                setResearchSearch('')
                setResearchCategoryFilter('')
                setAppliedResearchCategory('')
              }}
            >
              Back to Dashboard
            </button>

            {loading && <p>Loading research papers...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && research.length === 0 && (
              <p>No research papers found.</p>
            )}

            {/* RESEARCH TABLE AND SEARCH */}
            {!loading && !error && research.length > 0 && (
              <div className="admin-research-list">

                {/* TABLE HEADING */}
                <div className="admin-research-list-header">
                  <div>
                    <h3>Research Papers</h3>
                    <p>
                      Showing {filteredResearch.length} of {research.length} research papers
                    </p>
                  </div>
                </div>

                {/* SEARCH AND FILTER TOOLBAR */}
                <div className="admin-research-toolbar">

                  {/* SEARCH */}
                  <form
                    className="admin-search-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      setResearchSearch(researchSearchInput.trim())
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search by title, author, or keyword..."
                      value={researchSearchInput}
                      onChange={(event) =>
                        setResearchSearchInput(event.target.value)
                      }
                    />

                    <button type="submit">
                      Search
                    </button>
                  </form>

                  {/* CATEGORY FILTER */}
                  <div className="admin-filter-form">

                    <select
                      value={researchCategoryFilter}
                      onChange={(event) =>
                        setResearchCategoryFilter(event.target.value)
                      }
                    >
                      <option value="">All Categories</option>

                      {researchCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        setAppliedResearchCategory(researchCategoryFilter)
                      }
                    >
                      Filter
                    </button>

                    <button
                      type="button"
                      className="admin-reset-button"
                      onClick={() => {
                        setResearchSearchInput('')
                        setResearchSearch('')
                        setResearchCategoryFilter('')
                        setAppliedResearchCategory('')
                      }}
                    >
                      Reset
                    </button>

                  </div>

                </div>

                {/* RESEARCH TABLE */}
                {filteredResearch.length > 0 ? (
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
                        {filteredResearch.map((paper) => (
                          <tr key={paper._id}>
                            <td>{paper.title}</td>
                            <td>{paper.category}</td>
                            <td>{paper.year}</td>

                            <td>
                              <div className="admin-table-actions">

                                <Link
                                  to={`/research/${paper._id}`}
                                  className="admin-view-action"
                                >
                                  View
                                </Link>

                                <button
                                  type="button"
                                  className="admin-edit-action"
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
                                  type="button"
                                  className="admin-delete-action"
                                  onClick={() =>
                                    handleDelete(paper._id, paper.title)
                                  }
                                >
                                  Delete
                                </button>

                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                  </div>
                ) : (
                  <p className="admin-no-results">
                    No research papers match your search or filter.
                  </p>
                )}

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

        {/* DELETE RESEARCH CONFIRMATION MODAL */}
        {researchToDelete && (
          <div className="delete-modal-overlay">
            <div
              className="delete-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-research-modal-title"
              aria-describedby="delete-research-modal-description"
            >
              <div className="delete-modal-icon">
                🗑️
              </div>

              <h3 id="delete-research-modal-title">
                Delete Research Paper?
              </h3>

              <p id="delete-research-modal-description">
                Are you sure you want to delete
                <strong> "{researchToDelete.title}"</strong>?
                This action cannot be undone.
              </p>

              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="delete-cancel-btn"
                  onClick={() => setResearchToDelete(null)}
                  disabled={deletingResearch}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="delete-confirm-btn"
                  onClick={confirmDeleteResearch}
                  disabled={deletingResearch}
                >
                  {deletingResearch ? 'Deleting...' : 'Delete Research'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE USER CONFIRMATION MODAL */}
        {userToDelete && (
          <div className="delete-modal-overlay">
            <div
              className="delete-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-user-modal-title"
              aria-describedby="delete-user-modal-description"
            >
              <div className="delete-modal-icon">
                🗑️
              </div>

              <h3 id="delete-user-modal-title">
                Delete User?
              </h3>

              <p id="delete-user-modal-description">
                Are you sure you want to delete
                <strong> "{userToDelete.name}"</strong>?
                This action cannot be undone.
              </p>

              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="delete-cancel-btn"
                  onClick={() => setUserToDelete(null)}
                  disabled={deletingUser}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="delete-confirm-btn"
                  onClick={confirmDeleteUser}
                  disabled={deletingUser}
                >
                  {deletingUser ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default AdminDashboard
