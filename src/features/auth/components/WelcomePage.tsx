import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './WelcomePage.module.css'

export function WelcomePage() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth()

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.avatar}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} />
          ) : (
            <span>{user?.displayName?.charAt(0) || '?'}</span>
          )}
        </div>

        <h1 className={styles.greeting}>
          Welcome, <span className={styles.name}>{user?.displayName || 'User'}</span>!
        </h1>

        <p className={styles.email}>{user?.email}</p>

        <div className={styles.statusCard}>
          <div className={styles.statusIndicator}></div>
          <div className={styles.statusContent}>
            <h3>MVP 1: Authentication</h3>
            <p>✅ Google Sign-in working</p>
            <p>✅ User session active</p>
          </div>
        </div>

        <div className={styles.nextSteps}>
          <h4>Next: MVP 2</h4>
          <ul>
            <li>Load user preferences from Firestore</li>
            <li>Display accounts list</li>
            <li>Navigate to profile page</li>
          </ul>
        </div>

        <button className={styles.signOutButton} onClick={signOut}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

