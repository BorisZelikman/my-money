import React, { useState, useEffect } from "react";
import { loadActiveData } from "../../data/activeMethods";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import ActiveComponent from "./ActiveComponent";

function BalanceComponent() {
  const navigate = useNavigate()
  const [activeData, setActiveData] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    const loadedData = loadActiveData()
    setActiveData(loadedData)
    setTotalAmount(loadedData.reduce((total, active) => total + active.Amount, 0))
  }, [])

  return (
    <div className="balance">
      <h1>Balance</h1>
      {activeData.map((active) => (
        <ActiveComponent key={active.ID} active={active} />
      ))}
      <h2>Total: {totalAmount}</h2>

      <Link to="/add">Add</Link>
    </div>
  );
}

export default BalanceComponent;
