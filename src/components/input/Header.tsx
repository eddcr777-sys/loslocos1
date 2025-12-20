import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/">miApp</Link>
      </div>
      <nav>
        <ul>
          <li><Link to="/">Inicio</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;