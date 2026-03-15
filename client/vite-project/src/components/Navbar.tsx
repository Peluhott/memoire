import './Navbar.css'

type NavbarProps = {
  activeView: 'home' | 'connections'
  onNavigate: (view: 'home' | 'connections') => void
  onLogout: () => void
}

function Navbar({ activeView, onNavigate, onLogout }: NavbarProps) {
  return (
    <header className="memoire-nav">
      <button className="memoire-nav__brand" type="button" onClick={() => onNavigate('home')}>
        Memoire
      </button>
      <nav className="memoire-nav__links" aria-label="Primary">
        <button
          className={activeView === 'home' ? 'memoire-nav__link is-active' : 'memoire-nav__link'}
          type="button"
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
        <button
          className={
            activeView === 'connections' ? 'memoire-nav__link is-active' : 'memoire-nav__link'
          }
          type="button"
          onClick={() => onNavigate('connections')}
        >
          Connections
        </button>
        <button className="memoire-nav__link" type="button" onClick={onLogout}>
          Logout
        </button>
      </nav>
    </header>
  )
}

export default Navbar
