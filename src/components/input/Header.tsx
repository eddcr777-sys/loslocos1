import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/">MiApp</Link>
      </div>
      <nav>
        <ul>
          <li><Link to="/">Inicio</Link></li>
          {/* Aquí puedes agregar más enlaces en el futuro */}
        </ul>
      </nav>
    </header>
  );
};

export default Header;