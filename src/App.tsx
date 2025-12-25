function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">💰</span>
          <h1>MyMoneyMeter</h1>
        </div>
        <p className="tagline">Family Budget Management</p>
      </header>
      
      <main className="app-main">
        <div className="status-card">
          <div className="status-indicator success"></div>
          <div className="status-content">
            <h2>MVP 0: Infrastructure</h2>
            <p>✅ Vite + React + TypeScript</p>
            <p>✅ CI/CD Pipeline Ready</p>
            <p>✅ Firebase Hosting Configured</p>
          </div>
        </div>
        
        <div className="info-card">
          <h3>Next Steps</h3>
          <ul>
            <li>MVP 1: Authentication</li>
            <li>MVP 2: User Profile</li>
            <li>MVP 3: Assets Display</li>
          </ul>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Version 0.0.1 • Built with React + Vite</p>
      </footer>
    </div>
  )
}

export default App

