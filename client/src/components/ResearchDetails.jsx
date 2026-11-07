
import BASE_API_URL from '../api'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_URL = `${BASE_API_URL}/api/research`

function ResearchDetails() {
  const { id } = useParams()

  const [research, setResearch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function fetchResearch() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(`${API_URL}/${id}`, {
          signal: controller.signal,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Failed to retrieve research details.'
          )
        }

        setResearch(data.research)
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
  }, [id])

  if (loading) {
    return (
      <main className="details-status">
        <div className="loading-spinner"></div>
        <p>Loading research details...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="details-status">
        <h2>Unable to load research</h2>
        <p>{error}</p>
        <Link to="/" className="details-back-button">
          Back to ResearchHub
        </Link>
      </main>
    )
  }

  if (!research) {
    return (
      <main className="details-status">
        <h2>Research paper not found</h2>
        <Link to="/" className="details-back-button">
          Back to ResearchHub
        </Link>
      </main>
    )
  }

  const authors = Array.isArray(research.authors)
    ? research.authors.join(', ')
    : research.authors

  return (
    <div className="details-page">

      {/* Navigation */}
      <header className="details-navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">R</span>
          ResearchHub
        </Link>

        <Link to="/" className="details-home-link">
          Home
        </Link>
      </header>

      <main className="details-container">

        <Link to="/" className="back-link">
          ← Back to Research Library
        </Link>

        {/* Research Information */}
        <article className="details-card">

          <div className="details-header">
            <span className="details-category">
              {research.category}
            </span>

            <h1>{research.title}</h1>

            <p className="details-authors">
              {authors}
            </p>

            <div className="details-meta">
              <span>
                <strong>Publication Year:</strong> {research.year}
              </span>
            </div>
          </div>

          {/* Abstract and Keywords */}
          <div className="details-information">

            <section className="details-section abstract-section">
              <h2>Abstract</h2>
              <p className="abstract-text">
                {research.abstract}
              </p>
            </section>

            <section className="details-section keywords-section">
              <h2>Keywords</h2>

              <div className="keyword-list">
                {research.keywords?.length > 0 ? (
                  research.keywords.map((keyword, index) => (
                    <span key={index} className="keyword">
                      {keyword}
                    </span>
                  ))
                ) : (
                  <p className="no-keywords">
                    No keywords available.
                  </p>
                )}
              </div>
            </section>

          </div>

          {/* PDF Document */}
          <section className="details-section pdf-section">

            <div className="pdf-heading">
              <div>
                <h2>Research Paper</h2>
                <p>Full research document</p>
              </div>

              {research.pdfUrl && (
                <a
                  href={research.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-button"
                >
                  Open / Download PDF ↗
                </a>
              )}
            </div>

            {research.pdfUrl ? (
              <div className="pdf-viewer">
                <iframe
                  src={research.pdfUrl}
                  title="Research Paper PDF"
                  className="pdf-preview"
                />
              </div>
            ) : (
              <p className="no-pdf">
                No PDF document is currently available.
              </p>
            )}

          </section>

        </article>
      </main>

      <footer className="details-footer">
        <p>© 2026 ResearchHub. All rights reserved.</p>
        <p>Discover and explore academic research.</p>
      </footer>

    </div>
  )
}

export default ResearchDetails
