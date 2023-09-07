import React from "react";
import Typography from "@mui/material/Typography";

function ActiveComponent({ active }) {
  return (
    <React.Fragment>
      <Typography align="center" variant="h6" key={active.ID}>
        {active.Name}
        <br/>
        <Typography align="center" variant="overline">
          {active.CurrencyID}: {active.Amount}
        </Typography>
      </Typography>
    </React.Fragment>
  );
}

export default ActiveComponent;
