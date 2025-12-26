import { NavLink } from 'react-router-dom'
import styles from './MobileNav.module.css'

const navItems = [
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/operations', label: 'Operations', icon: '📋' },
  { path: '/mutuals', label: 'Shared', icon: '🤝' },
]

export function MobileNav() {
  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

