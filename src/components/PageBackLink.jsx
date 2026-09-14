import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function PageBackLink({ fallback = '/', children = 'Back' }) {
  const navigate = useNavigate()
  const goBack = (event) => {
    if ((window.history.state?.idx ?? 0) <= 0) return
    event.preventDefault()
    navigate(-1)
  }
  return <Link to={fallback} onClick={goBack} className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 font-semibold text-medzo-blue hover:underline focus:outline-none focus:ring-2 focus:ring-medzo-blue/30"><ArrowLeft size={18} aria-hidden="true" />{children}</Link>
}
