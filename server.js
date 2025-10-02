const express = require('express'); //Express js is use to create server
const path = require('path'); //path allow the code to know the files locations
const bodyParser = require('body-parser'); //body-parser allow the code to send and recieve data
const knex = require('knex'); //knex will allow the cde to access the database(farmlink)
// const cors = require('cors');


const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1', //database host number
        user: 'postgres', //psql user name
        password: '12.comQw', //password
        database: 'farmlink' //database name
    }
})
const app = express();
// app.use(cors());

let initialPath = path.join(__dirname, "public");

app.use(bodyParser.json());
app.use(express.static(initialPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(initialPath, "index.html"));
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(initialPath, "login.html"));
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(initialPath, "register.html"));
})

app.get('/marketplace', (req, res) => {
    res.sendFile(path.join(initialPath, "marketplace.html"));
})

app.post('/register-user', (req, res) => {
    //gives access to the variables in the request
    const {firstname, lastname, email, password, parish, role} = req.body; 

    if (!firstname || !lastname || !email || !password || !parish || !role) {
        res.json('fill all the fields');
    } else {
        db("users").insert({
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: password, 
            parish: parish,
            role: role,
        })
        .returning(["firstname", "lastname", "email"])
        .then(data => {
            res.json(data[0])
        })
        .catch(err => {
            if (err.code === '23505') { // unique_violation in Postgres
                return res.json('email already exists');
            } else {
                console.error(err);
                return res.status(500).json('Database error');
            }
        }) //error handler
        
    }
})

app.post('/login-user', (req, res) => {
    const { email, password} = req.body;
     db.select('firstname', 'lastname', 'email')
     .from('users')
     .where({
        email: email,
        password: password
     })
     .then(data => {
        if(data.length){
            res.json(data[0]);
        } else{
            res.json('email or password is incorect')
        }
     })
})

app.listen(3000, (req, res) => {
    console.log('listening on port 3000.......')
})