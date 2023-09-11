import React from 'react';
import { useParams, Link} from "react-router-dom";

function NavigationBar({ userID }) {

  return (
    <nav>
      <ul>
        <li>
          <Link to={`/user-profile/${userID}`}>Main</Link>
        </li>
        <li>
          <Link to={`/user-profile/${userID}/balance`}>Balance</Link>
        </li>
        <li>
          <Link to="/">SignOut</Link>
        </li>
      </ul>
    </nav>
  );
}

export default NavigationBar;