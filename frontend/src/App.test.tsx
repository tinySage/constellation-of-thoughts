import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the observatory welcome message', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /your thoughts, gently gathered/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/calm place to begin noticing/i),
    ).toBeInTheDocument()
  })
})
