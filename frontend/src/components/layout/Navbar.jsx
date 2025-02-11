import "../../css/navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <a href="/" className="navbar-brand">sokodoko</a>
        <div className="navbar-menu">
          {/* <a href="/" className="navbar-item">Home</a> */}
          {/* <a href="/about" className="navbar-item">About</a>
          <a href="/contact" className="navbar-item">Contact</a> */}
        </div>
      </div>
    </nav>
  )
}

export default Navbar