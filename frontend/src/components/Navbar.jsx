function Navbar() {
  return (
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
  );
}

export default Navbar;
