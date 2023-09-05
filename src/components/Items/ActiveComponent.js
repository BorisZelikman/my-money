import React from "react";

function ActiveComponent({ active }) {
  return (
    <div key={active.ID}>
      <h2>{active.Name}</h2>
      <p>
        {active.CurrencyID}: {active.Amount}
      </p>
    </div>
  );
}

export default ActiveComponent;
