import categoryModel from '../models/CategoryModel.js';

// Add a new category
const addCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    if (!name) {
      return res.json({ success: false, message: 'Category name is required' });
    }

    // Check if category already exists
    const existingCategory = await categoryModel.findOne({ name });
    if (existingCategory) {
      return res.json({ success: false, message: 'Category already exists' });
    }

    const category = new categoryModel({
      name,
      subcategories: subcategories || []
    });

    await category.save();
    res.json({ success: true, message: 'Category added successfully', category });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// Get all categories
const listCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({}).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// Add subcategory to existing category
const addSubcategory = async (req, res) => {
  try {
    const { categoryName, subcategory } = req.body;

    if (!categoryName || !subcategory) {
      return res.json({ success: false, message: 'Category name and subcategory are required' });
    }

    const category = await categoryModel.findOne({ name: categoryName });
    
    if (!category) {
      return res.json({ success: false, message: 'Category not found' });
    }

    // Check if subcategory already exists
    if (category.subcategories.includes(subcategory)) {
      return res.json({ success: false, message: 'Subcategory already exists' });
    }

    category.subcategories.push(subcategory);
    await category.save();

    res.json({ success: true, message: 'Subcategory added successfully', category });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.json({ success: false, message: 'Category ID is required' });
    }

    await categoryModel.findByIdAndDelete(id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// Remove subcategory from category
const removeSubcategory = async (req, res) => {
  try {
    const { categoryName, subcategory } = req.body;

    if (!categoryName || !subcategory) {
      return res.json({ success: false, message: 'Category name and subcategory are required' });
    }

    const category = await categoryModel.findOne({ name: categoryName });
    
    if (!category) {
      return res.json({ success: false, message: 'Category not found' });
    }

    category.subcategories = category.subcategories.filter(sub => sub !== subcategory);
    await category.save();

    res.json({ success: true, message: 'Subcategory removed successfully', category });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

export { addCategory, listCategories, addSubcategory, deleteCategory, removeSubcategory };
