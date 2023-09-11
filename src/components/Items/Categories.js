import React, { useState } from 'react';
import { typeCategories, categories } from "../../data/categoryData";
import CategoryEditor from "./CategoryEditor";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

export const Categories = () => { 
    
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
