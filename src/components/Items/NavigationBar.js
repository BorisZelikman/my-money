import React, { useState, useEffect }  from 'react';
import { Link, useLocation } from "react-router-dom";
import './NavigationBar.css'

function NavigationBar({ userID }) {
  const [showNavBar, setShowNavBar] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setShowNavBar(location.pathname !== '/registration' && location.pathname !== '/');
  }, [location.pathname]);


  return (
    <nav style={{ display: showNavBar ? 'block' : 'none' }}>
      <div>
      <ul className="nav-list">
        <li className="nav-item">
          <div className="nav-link" >
            <Link to={`/user-profile/${userID}`}>user-profile</Link>
          </div>
        </li>
        <li>
          <div className="nav-link" >
            <Link to={`/user-profile/${userID}/balance`}>Balance</Link>
          </div>
        </li>
        <li className="nav-item">
          <div className="nav-link" >
            <Link to={`/user-profile/${userID}/operation`}>Operation</Link>
          </div>
        </li>
        <li className="nav-item">
          <div className="nav-link" >
            <Link to={`/user-profile/${userID}/history`}>History</Link>
          </div>
        </li>
        <li className="nav-item">
          <div className="nav-link" >
            <Link to={`/user-profile/${userID}/graph`}>Graph</Link>
          </div>
        </li>
        <li className="nav-item">
          <div className="nav-link" >
            <Link to="/">SignOut</Link>
          </div>
        </li>
      </ul>
      </div>
    </nav>
  );
}

export default NavigationBar;