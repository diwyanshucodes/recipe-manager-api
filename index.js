const express = require('express');
const authRouter = require('./routes/auth');
const recipesRouter = require('./routes/recipes');
const cors = require('cors');
const app = express();

app.use(cors({
    origin:['http://localhost:5173', 'https://recipe-manager-client.vercel.app/']
}))
app.use(express.json());

app.use('/api/auth', authRouter)
app.use('/api/recipes', recipesRouter)

//any other route
app.use((req,res)=>{
    res.status(404).json({error: "Route not exist"})
})

app.use((err,req,res,next)=>{
    console.error(err.message)
    res.status(500).json({error: "Something went wrong"})
})

app.listen(3000, ()=>{
    console.log('Server running on port: 3000')
})
