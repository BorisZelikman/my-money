import React from 'react';
import { Link} from "react-router-dom";
import './NavigationBar.css'

function NavigationBar({ userID }) {

  return (
    <nav>
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
            <Link to={`/user-profile/${userID}/operationhistory`}>OperationHistory</Link>
          </div>
        </li>
        <li className="nav-item">
          <div className="nav-link" >
            <Link to={`/user-profile/${userID}/graph`}>Graph</Link>
          </div>
        </li>
        <li className="nav-item">
          <div className="nav-link" >
            <Link to={`/user-profile/${userID}/asset`}>Asset</Link>
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