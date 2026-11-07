import VerifyEmail from './components/VerifyEmail'
import BASE_API_URL from './api'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './components/AdminDashboard'
import Register from './components/Register'
import Login from './components/Login'
import { useEffect, useState } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import ResearchDetails from './components/ResearchDetails'
import './App.css'

const API_URL = `${BASE_API_URL}/api/research`

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [research, setResearch] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [category, setCategory] = useState('')
  const [year, setYear] = useState('')

  const limit = 6

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  useEffect(() => {
    if (location.pathname !== '/' || !location.state?.successMessage) {
      return
    }

    const savedUser = localStorage.getItem('user')

    setUser(savedUser ? JSON.parse(savedUser) : null)
    setSuccessMessage(location.state.successMessage)

    navigate('/', {
      replace: true,
      state: null,
    })
  }, [location, navigate])

  useEffect(() => {
    if (!successMessage) return

    const timer = setTimeout(() => {
      setSuccessMessage('')
    }, 4000)

    return () => clearTimeout(timer)
  }, [successMessage])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setSuccessMessage('You have successfully logged out.')
  }

  useEffect(() => {
    const controller = new AbortController()

    async function fetchResearch() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_URL}?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&year=${encodeURIComponent(year)}&page=${currentPage}&limit=${limit}`,
          { signal: controller.signal },
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to retrieve research.')
        }

        setResearch(data.research || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.totalCount || 0)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchResearch()

    return () => controller.abort()
  }, [search, category, year, currentPage])

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app">
            <header className="navbar">
              <Link to="/" className="brand">
                <span className="brand-icon">R</span>
                ResearchHub
              </Link>

              <nav className="nav-links">
                <a href="#home">Home</a>
                <a href="#research">Research Papers</a>
                <a href="#about">About</a>
              </nav>

              <div className="nav-actions">
                {user ? (
                  <>
                    <span className="user-greeting">
                      Hi, {user.name}
                    </span>

                    {user.role === 'admin' && (
                      <Link to="/admin" className="btn-login">
                        Admin Dashboard
                      </Link>
                    )}

                    <button className="btn-primary" onClick={handleLogout}>
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-login">
                      Log In
                    </Link>

                    <Link to="/register" className="btn-primary">
                      Register
                    </Link>
                  </>
                )}
              </div>

            </header>

            <main>
              {successMessage && (
                <div className="toast-notification">
                  <span className="toast-icon">✓</span>

                  <span className="toast-message">{successMessage}</span>

                  <button
                    onClick={() => setSuccessMessage('')}
                    aria-label="Close notification"
                  >
                    ×
                  </button>
                </div>
              )}

              <section className="hero" id="home">
                <span className="eyebrow">
                  YOUR ACADEMIC RESEARCH REPOSITORY
                </span>

                <h1>
                  Discover research.
                  <br />
                  <span>Explore knowledge.</span>
                </h1>

                <p>
                  Explore academic research papers, discover new ideas, and
                  access knowledge shared by students and researchers.
                </p>

                <div className="hero-search">
                  <span>⌕</span>

                  <input
                    type="text"
                    placeholder="Search research papers, authors, or keywords..."
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setCurrentPage(1)
                    }}
                  />

                  <button
                    onClick={() =>
                      document.getElementById('research')?.scrollIntoView({
                        behavior: 'smooth',
                      })
                    }
                  >
                    Search
                  </button>
                </div>

                <div className="hero-note">
                  Explore research across different academic fields.
                </div>
              </section>

              <section className="research-section" id="research">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">EXPLORE THE COLLECTION</span>
                    <h2>Featured Research</h2>
                    <p>Discover research available in our repository.</p>
                  </div>

                  <a href="#research" className="view-all">
                    View all papers →
                  </a>
                </div>

                <div className="filter-controls">
                  <select
                    value={category}
                    onChange={(event) => {
                      setCategory(event.target.value)
                      setCurrentPage(1)
                    }}
                  >
                    <option value="">All Categories</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">
                      Information Technology
                    </option>
                    <option value="Education">Education</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                  </select>

                  <select
                    value={year}
                    onChange={(event) => {
                      setYear(event.target.value)
                      setCurrentPage(1)
                    }}
                  >
                    <option value="">All Years</option>

                    {Array.from({ length: 10 }, (_, index) => 2026 - index).map(
                      (itemYear) => (
                        <option key={itemYear} value={itemYear}>
                          {itemYear}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <p className="results-count">
                  {totalCount} research{' '}
                  {totalCount === 1 ? 'paper' : 'papers'} found
                </p>

                {loading && (
                  <p className="empty-message">
                    Loading research papers...
                  </p>
                )}

                {error && (
                  <p className="empty-message">{error}</p>
                )}

                {!loading && !error && research.length === 0 && (
                  <p className="empty-message">
                    No matching research found.
                  </p>
                )}

                {!loading && !error && research.length > 0 && (
                  <>
                    <div className="research-grid">
                      {research.map((paper) => (
                        <article className="research-card" key={paper._id}>
                          <div className="paper-icon">PDF</div>

                          <span className="paper-category">
                            {paper.category}
                          </span>

                          <h3>{paper.title}</h3>

                          <p className="paper-authors">
                            {Array.isArray(paper.authors)
                              ? paper.authors.join(', ')
                              : paper.authors}
                          </p>

                          <div className="paper-footer">
                            <span>{paper.year}</span>

                            <Link
                              to={`/research/${paper._id}`}
                              className="view-details"
                            >
                              View Details →
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          onClick={() =>
                            setCurrentPage((page) => page - 1)
                          }
                          disabled={currentPage === 1 || loading}
                        >
                          ← Previous
                        </button>

                        <span>
                          Page {currentPage} of {totalPages}
                        </span>

                        <button
                          onClick={() =>
                            setCurrentPage((page) => page + 1)
                          }
                          disabled={
                            currentPage >= totalPages || loading
                          }
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="about-section" id="about">
                <span className="eyebrow">ABOUT RESEARCHHUB</span>
                <h2>Knowledge made accessible.</h2>
                <p>
                  ResearchHub provides a central place to discover and access
                  academic research. Our goal is to make research easier to
                  find, explore, and share.
                </p>
              </section>
            </main>

            <footer className="footer">
              <span>© 2026 ResearchHub</span>
              <span>Academic Research Repository</span>
            </footer>
          </div>
        }
      />

      <Route path="/login" element={<Login />} />

      <Route
        path="/research/:id"
        element={<ResearchDetails />}
      />

      <Route path="/register" element={<Register />} />

      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
      
    </Routes>
  )
}

export default App
