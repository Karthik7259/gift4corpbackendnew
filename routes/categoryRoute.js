import express from 'express';
import { addCategory, listCategories, addSubcategory, deleteCategory, removeSubcategory } from '../controllers/categoryController.js';
import adminAuth from '../middleware/adminAuth.js';

const categoryRouter = express.Router();

categoryRouter.post('/add', adminAuth, addCategory);
categoryRouter.get('/list', listCategories);
categoryRouter.post('/add-subcategory', adminAuth, addSubcategory);
categoryRouter.post('/delete', adminAuth, deleteCategory);
categoryRouter.post('/remove-subcategory', adminAuth, removeSubcategory);

export default categoryRouter;
