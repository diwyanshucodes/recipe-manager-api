const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/index');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        //email already exists
        const exists = await pool.query('SELECT id from users WHERE email = $1', [email]);
        if (exists.rows.length > 0) return res.status(400).json({ error: 'Email already in use' });

        //hash password
        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query('INSERT INTO users(email,password_hash) VALUES ($1,$2) RETURNING id, email, created_at', [email, password_hash]);
        res.status(201).json({ user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message })
    }

})
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        //find user
        const result = await pool.query('SELECT * from users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
        const user = result.rows[0];

        //compare password
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        //sign jwt token
        const token = jwt.sign(
            {userId:user.id, email:user.email},
            process.env.JWT_SECRET,
            {expiresIn : '7d'}
        );
        res.json({token});


    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})



module.exports = router;