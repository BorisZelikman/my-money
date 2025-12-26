import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/ui'
import { MobileNav } from './MobileNav'
import styles from './NavBar.module.css'

const navItems = [
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/operations', label: 'Operations', icon: '📋' },
  { path: '/mutuals', label: 'Shared', icon: '🤝' },
]

export function NavBar() {
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
        </div>
      </nav>
      <MobileNav />
    </>
  )
}

