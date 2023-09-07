import React from "react";
import TextField from "@mui/material/TextField";

function InputField({ placeholder, value, onChange }) {
  return (
    <TextField 
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />

    // <input
    //   type="text"
    //   placeholder={placeholder}
    //   value={value}
    //   onChange={onChange}
    // />
  );
}

export default InputField;
