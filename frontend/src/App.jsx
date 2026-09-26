import "./App.css";
import EncryptionPanel from "./components/EncryptionPanel";
import Visualization from "./pages/Visualization";
import Comparison from "./pages/Comparison";

function App() {
  return (
    <div className="app">
      <div className="ambient-glow ambient-glow-one"></div>
      <div className="ambient-glow ambient-glow-two"></div>

      <nav className="navbar">
        <a className="nav-logo" href="#home">
          <img src="/src/assets/aescrypt-navbar.png" alt="AESCRYPT" />
        </a>

        <div className="nav-links">
          <a className="active" href="#home">
            Home
          </a>

          <a href="#encrypt">Encrypt</a>

          <a href="#visualize">Visualize</a>

          <a href="#compare">Compare</a>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-logo">
            <img src="/src/assets/aescrypt-logo.png" alt="AESCRYPT" />
          </div>

          <div className="hero-content">
            <p className="hero-description">
              AES file encryption, mode analysis, and visualization in one
              place.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#encrypt">
                <span>ENCRYPT A FILE</span>

                <span className="button-arrow">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </span>
              </a>

              <a className="secondary-button" href="#visualize">
                EXPLORE AES MODES
              </a>
            </div>
          </div>

          <div className="hero-meta">
            <span>AES</span>
            <span className="meta-dot"></span>
            <span>ECB</span>
            <span className="meta-dot"></span>
            <span>CBC</span>
            <span className="meta-dot"></span>
            <span>FILE ENCRYPTION</span>
          </div>
        </section>

        <EncryptionPanel />

        <Visualization />

        <Comparison />
      </main>
    </div>
  );
}

export default App;
