import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

const session = {
  token: 'access-token',
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  user: {
    id: 'b4de84fc-3907-4f36-9803-c82912d9cb72',
    username: 'medzo.user',
    staffId: 'P1001',
    email: 'user@example.com',
    firstName: 'Medzo',
    lastName: 'User',
    roles: ['User'],
  },
}

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/')
})

describe('authentication UI', () => {
  it('redirects a signed-out user away from a protected route', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ message: 'Authentication session is unavailable.' }, 401),
    ))
    window.history.replaceState({}, '', '/products')

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('restores the cookie session, updates the header, and logs out', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url.endsWith('/auth/refresh')) return jsonResponse(session)
      if (url.endsWith('/auth/revoke')) return new Response(null, { status: 204 })
      if (url.endsWith('/reviews')) return jsonResponse([])
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    expect(await screen.findByText('Hi, Medzo')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/revoke'),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    )
    expect(localStorage.getItem('medzo.auth')).toBeNull()
  })

  it('signs in with Staff ID and redirects to the matching role dashboard', async () => {
    const adminSession = {
      ...session,
      user: { ...session.user, staffId: 'A1001', roles: ['Admin'] },
    }
    const fetchMock = vi.fn(async (url, options) => {
      if (url.endsWith('/auth/refresh')) return jsonResponse({ message: 'No session' }, 401)
      if (url.endsWith('/auth/login')) {
        expect(JSON.parse(options.body)).toEqual({ identifier: 'A1001', password: 'Strong1!' })
        return jsonResponse(adminSession)
      }
      if (url.endsWith('/dashboard/admin')) return jsonResponse({ modules: [], users: [], totalUsers: 0 })
      if (url.endsWith('/users/staff-invitations')) return jsonResponse([])
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    window.history.replaceState({}, '', '/login')
    render(<App />)

    await screen.findByRole('heading', { name: 'Welcome' })
    await userEvent.type(screen.getByLabelText('Staff ID, Username, or Email'), 'A1001')
    await userEvent.type(screen.getByLabelText('Password'), 'Strong1!')
    await userEvent.click(screen.getByRole('button', { name: 'Login to Account' }))

    expect(await screen.findByRole('heading', { name: 'Administrator Dashboard' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/admin')
  })

  it('lets an Admin create a staff account with an explicit matching role', async () => {
    const adminSession = {
      ...session,
      user: { ...session.user, staffId: 'A1001', roles: ['Admin'] },
    }
    let createdBody = null
    const fetchMock = vi.fn(async (url, options = {}) => {
      if (url.endsWith('/auth/refresh')) return jsonResponse(adminSession)
      if (url.endsWith('/dashboard/admin')) return jsonResponse({ modules: [], users: [], totalUsers: 0 })
      if (url.endsWith('/users/staff-invitations')) return jsonResponse([])
      if (url.endsWith('/users') && options.method === 'POST') {
        createdBody = JSON.parse(options.body)
        return jsonResponse({ user: { id: 'new-user' } }, 201)
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    window.history.replaceState({}, '', '/admin')
    render(<App />)

    await screen.findByRole('heading', { name: 'Administrator Dashboard' })
    expect(screen.queryByRole('option', { name: 'Admin' })).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('First name'), 'New')
    await userEvent.type(screen.getByLabelText('Last name'), 'Pharmacist')
    await userEvent.type(screen.getByLabelText('Username'), 'new.pharmacist')
    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com')
    await userEvent.type(screen.getByLabelText('Staff ID (P prefix)'), 'P2001')
    await userEvent.type(screen.getByLabelText('Temporary password'), 'Strong1!')
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Strong1!')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Staff account created successfully.')).toBeInTheDocument()
    expect(createdBody).toEqual(expect.objectContaining({ staffId: 'P2001', role: 'Pharmacist' }))
  })
})
