import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addActive } from "../../data/activeMethods";
import InputField from "./InputField";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

function AddComponent() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    currencyID: "",
    amount: 0
  })

  const handleAdd = () => {
    const newActive = addActive(formData.name, formData.currencyID, formData.amount)
    if (newActive) {
      setFormData({ name: "", currencyID: "", amount: 0 })
      navigate("/balance")
    }
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Stack spacing={5}>
        <Typography align="center" variant="h6">
          ADD
        </Typography>
        <InputField
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <InputField
          placeholder="Currency ID"
          value={formData.currencyID}
          onChange={(e) => setFormData({ ...formData, currencyID: e.target.value })}
        />
        <InputField
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
        />
        <Button style={{ textDecoration: "none" }} onClick={handleAdd}>Add</Button>
      </Stack>
    </Box>
  );
}

export default AddComponent;
