import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [deployed] = useState(new Date().toLocaleString())

  return (
    <div className="App">
      <header className="App-header">
        <h1>⚡ React + Vite + SiteFast</h1>
        <p className="subtitle">Lightning-fast deployment made easy</p>
      </header>

      <main>
        <div className="hero">
          <h2>Your React App is Live!</h2>
          <p>Deployed with SiteFast in seconds</p>
        </div>

        <div className="card">
          <h3>Counter Demo</h3>
          <div className="counter">
            <button onClick={() => setCount((count) => count - 1)}>-</button>
            <span className="count">{count}</span>
            <button onClick={() => setCount((count) => count + 1)}>+</button>
          </div>
          <button onClick={() => setCount(0)} className="reset">Reset</button>
        </div>

        <div className="features">
          <div className="feature">
            <span className="icon">⚛️</span>
            <h3>React 18</h3>
            <p>Latest React with hooks</p>
          </div>
          <div className="feature">
            <span className="icon">⚡</span>
            <h3>Vite</h3>
            <p>Lightning-fast HMR</p>
          </div>
          <div className="feature">
            <span className="icon">🚀</span>
            <h3>SiteFast</h3>
            <p>Instant deployment</p>
          </div>
        </div>

        <div className="deployment-info">
          <p><strong>Deployed:</strong> {deployed}</p>
          <p><strong>Framework:</strong> React + Vite</p>
          <p><strong>Build Tool:</strong> Vite</p>
        </div>
      </main>
    </div>
  )
}

export default App
