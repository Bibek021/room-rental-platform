import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-text">@project2025final</div>
      <div className="footer-icons">
        <a href="https://www.facebook.com/login" target="_blank" rel="noopener noreferrer" className="footer-icon-link">
          <i className="fab fa-facebook-f"></i>
        </a>
        <a href="https://www.instagram.com/accounts/login" target="_blank" rel="noopener noreferrer" className="footer-icon-link">
          <i className="fab fa-instagram"></i>
        </a>
        <a href="https://www.whatsapp.com" target="_blank" rel="noopener noreferrer" className="footer-icon-link">
          <i className="fab fa-whatsapp"></i>
        </a>
      </div>
    </footer>
  );
};

export default Footer;