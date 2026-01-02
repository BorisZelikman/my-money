import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/ui'
import { MobileNav } from './MobileNav'
import { useAuthStore } from '@/stores/authStore'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import styles from './NavBar.module.css'

const navItems = [
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/operations', label: 'Operations', icon: '📋' },
  { path: '/mutuals', label: 'Shared', icon: '🤝' },
]

export function NavBar() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handlePreferences = () => {
    setShowMenu(false)
    navigate('/profile')
  }

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.container}>
          <div className={styles.brand}>
            <Logo style={{ width: 'auto' }} />
          </div>

          <ul className={styles.links}>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `${styles.link} ${isActive ? styles.active : ''}`
                  }
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* User Avatar */}
          <div className={styles.userSection} ref={menuRef}>
            <button
              className={styles.avatarButton}
              onClick={() => setShowMenu(!showMenu)}
              aria-label="User menu"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                </div>
              )}
            </button>

            {showMenu && (
              <div className={styles.dropdownMenu}>
                <div className={styles.menuHeader}>
                  <span className={styles.userName}>{user?.displayName}</span>
                  <span className={styles.userEmail}>{user?.email}</span>
                </div>
                <div className={styles.menuDivider}></div>
                <button className={styles.menuItem} onClick={handlePreferences}>
                  <span>⚙️</span>
                  Preferences
                </button>
                <button className={styles.menuItem} onClick={handleLogout}>
                  <span>🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <MobileNav />
    </>
  )
}
