const categoryRepository = require('../repositories/categoryRepository');

module.exports.getCategories = async (req, res) => {
    try {
        const categories = await categoryRepository.getAll();
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching categories' });
    }
}

module.exports.getCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await categoryRepository.getById(categoryId);
        
        if (!category) {
            res.status(404).json({ error: `Category with id ${categoryId} not found` });
            return;
        }
        res.status(200).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching category' });
    }
}

module.exports.create = async (req, res) => {
    try {

        if (req.decoded.role !== "admin") {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const description = req.body.description;
        if (!description) {
            res.status(400).json({ error: 'Category description not specified' });
            return;
        }

        const existingDescription = await categoryRepository.getByDescription(description);
        if (existingDescription) {
            res.status(400).json({ error: `Category ${description} already exists` });
            return;
        }

        const newCategory = await categoryRepository.create(description);
        res.status(200).json(newCategory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating category' });
    }
}

module.exports.delete = async (req, res) => {
    try {
        if (req.decoded.role !== "admin") {
            res.status(403).json({ error: 'Access denied. You are not an admin.' });
            return;
        }

        const categoryId = req.params.categoryId;
        const category = await categoryRepository.getById(categoryId);
        
        if (!category) {
            res.status(404).json({ error: `Category with id ${categoryId} not found` });
            return;
        }

        await categoryRepository.delete(categoryId);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting category' });
    }
}