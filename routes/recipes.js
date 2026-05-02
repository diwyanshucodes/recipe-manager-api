const express = require('express');
const pool = require('../db/index');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();


router.use(requireAuth);

//get all recipes without ingredients 
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM recipes WHERE user_id = $1 ORDER BY created_at DESC', [req.user.userId])
        res.json({ recipes: result.rows });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})
//get one recipe
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const recipeResult = await pool.query('SELECT * FROM recipes WHERE id = $1 AND user_id = $2', [id, req.user.userId])
        if (recipeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        const recipe = recipeResult.rows[0];
        const ingredientsResult = await pool.query('SELECT * FROM ingredients WHERE recipe_id = $1', [recipe.id])
        const ingredients = ingredientsResult.rows;
        res.json({ recipe: { ...recipe, ingredients } });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

//add a recipe
router.post('/', async (req, res) => {
    try {
        const { title, description, prep_time, category, ingredients } = req.body;
        if (!title) return res.status(400).json({ error: 'Title missing' });

        const recipeResult = await pool.query('INSERT INTO recipes(title,description,prep_time,category,user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [title, description, prep_time, category, req.user.userId]);
        const recipe = recipeResult.rows[0];

        // ingredients = [{ name: 'sugar', amount: '2', unit: 'cups' }, ...]
        // insert each ingredient in a loop:
        for (const ing of ingredients) {
            await pool.query(
                'INSERT INTO ingredients (name, amount, unit, recipe_id) VALUES ($1,$2,$3,$4)',
                [ing.name, ing.amount, ing.unit, recipe.id]
            )
        }
        //will these all run parallel? explain for loop and await

        res.status(201).json({recipe:  {...recipe, ingredients }});

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

//update a recipe
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, prep_time, category, ingredients } = req.body;
        if (!title) return res.status(400).json({ error: 'Title missing' });


        const recipeResult = await pool.query('UPDATE recipes SET title=$1, description=$2, prep_time=$3, category=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
            [title, description, prep_time, category, id, req.user.userId]);
        if (recipeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' })
        }
        const recipe = recipeResult.rows[0];
        const deleteIngredients = await pool.query('DELETE FROM ingredients WHERE recipe_id=$1', [recipe.id]);

        // ingredients = [{ name: 'sugar', amount: '2', unit: 'cups' }, ...]
        // insert each ingredient in a loop:
        for (const ing of ingredients) {
            await pool.query(
                'INSERT INTO ingredients (name, amount, unit, recipe_id) VALUES ($1,$2,$3,$4)',
                [ing.name, ing.amount, ing.unit, recipe.id]
            )
        }
const newIngredients = await pool.query('SELECT * FROM ingredients WHERE recipe_id=$1', [recipe.id])
res.json({ recipe: { ...recipe, ingredients: newIngredients.rows } })

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

//delete a recipe
/**
 *    'DELETE FROM notes WHERE id=$1 AND user_id=$2 RETURNING *',
        [id, req.user.userId]
 */
router.delete('/:id', async (req, res) => {
    try {

        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM recipes WHERE id=$1 AND user_id=$2 RETURNING *',
            [id, req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' })
        }
        res.json({ message: `Recipe ${id} deleted` })
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

module.exports = router;