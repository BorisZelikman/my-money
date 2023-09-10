import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addActive } from "../../data/activeMethods";
import InputField from "./InputField";

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
    <div className="add">
      <h2>Add</h2>
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
      <button onClick={handleAdd}>Add</button>
    </div>
  );
}

export default AddComponent;
