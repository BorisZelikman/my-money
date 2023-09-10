import React, { useState } from 'react';
import { typeCategories, categories } from "../../data/categoryData";
import CategoryEditor from "./CategoryEditor";
import {
  Box,
  Typography,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';


function Categories() {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  const handleCategoryClick = (category) => {
    setEditingCategory(category)
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
  }

  const handleSaveCategory = (newCategory) => {
    // add logic
  }

  return (
    <Stack sx={{ display: 'flex', justifyContent: 'center' }}>
      <Typography align="center" variant="h6">
        CATEGORIES
      </Typography>
      <Box>
        <List>
          {categories.map((category) => (
            <ListItem key={category.id}>
              <ListItemText
                primary={category.name}
                secondary={typeCategories.find(
                  (typeCat) => typeCat.id === category.typeCategoryId
                ).name}
              />
              <Button onClick={() => handleCategoryClick(category)}>
                Edit
              </Button>
              <Button color="error">Delete</Button>
            </ListItem>
          ))}
        </List>
      </Box>
      <Button onClick={() => handleCategoryClick(null)}>
        ADD NEW CATEGORY
      </Button>
      <CategoryEditor
        open={isEditorOpen}
        handleClose={handleCloseEditor}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
    </Stack>
  );
}

export default Categories;
