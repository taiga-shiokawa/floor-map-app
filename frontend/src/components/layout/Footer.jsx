import "../../css/footer.css"

const Footer = () => {
  return (
    <footer className="footer">
    {/* <div className="footer-content">
      <div className="footer-links">
        <a href="/privacy" className="footer-link">Privacy Policy</a>
        <a href="/terms" className="footer-link">Terms of Service</a>
        <a href="/contact" className="footer-link">Contact</a>
      </div>
    </div> */}
    <div className="footer-copyright">
      © {new Date().getFullYear()} sokodoko
    </div>
  </footer>
  )
}

export default Footer