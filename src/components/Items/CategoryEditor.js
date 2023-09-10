import React, { useState, useEffect } from 'react';
import { typeCategories } from "../../data/categoryData";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack
} from '@mui/material';

function CategoryEditor({ open, handleClose, category, onSave }) {
  const [name, setName] = useState(category ? category.name : ``)
  const [typeCategoryId, setTypeCategoryId] = useState(category ? category.typeCategoryId : ``)

  const handleNameChange = (event) => {
    const changedName = event.target.value
    setName(changedName)
  }

  const handleTypeChange = (event) => {
    const selectedTypeCategoryId = event.target.value
    setTypeCategoryId(selectedTypeCategoryId)
  }

  const handleSave = () => {
    const newCategory = {
      name,
      typeCategoryId,
    }

    onSave(newCategory)
    handleClose()
  }

  useEffect(() => {
    if (open) {
      setName(category ? category.name : ``)
      setTypeCategoryId(category ? category.typeCategoryId : ``)
    } else {
      setName(``)
      setTypeCategoryId(``)
    }
  }, [open, category])

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle variant="h6">{category ? 'EDIT CATEGORY' : 'ADD CATEGORY'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            label="Name"
            fullWidth
            value={name}
            onChange={handleNameChange}
          />
          <TextField
            select
            label="Type"
            fullWidth
            value={typeCategoryId}
            onChange={handleTypeChange}
          >
            {typeCategories.map((typeCategory) => (
              <MenuItem key={typeCategory.id} value={typeCategory.id}>
                {typeCategory.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CategoryEditor;
