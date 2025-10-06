const express = require('express'); //Express js is use to create server
const path = require('path'); //path allow the code to know the files locations
const bodyParser = require('body-parser'); //body-parser allow the code to send and recieve data
const knex = require('knex'); //knex will allow the cde to access the database(farmlink)
const jwt = require('jsonwebtoken');
const { error } = require('console');

const SECRET_KEY = 'super_secret_key';

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

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided'});

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({error: 'Invalid token'});

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({error: 'Invalid or Expired token format'});
        req.user = decoded; // attach user info
        console.log(decoded);
        next();
    });
};

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
        .returning(["*"]) // returning all the columns in the users table of the current row
        .then(data => {
            // console.log(req.session.user);
            res.json(data[0]);
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

app.post('/login-user', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists with this email and password
    const data = await db('users')
      .select('firstname', 'lastname', 'email')
      .where({ email, password });

    if (!data.length) {
      return res.status(400).json({ error: 'Email or password is incorrect' });
    }

    // Get the full user record (includes the ID)
    const user = await db('users').where({ email }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Create a JWT token for authentication
    const token = jwt.sign(
      { id: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Send the user info and token to the frontend
    res.json({ userData: data[0], token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.get('/current-user', (req, res) => {
    const email = req.query.email; // or read from session
    if (!email) return res.status(400).json({error: "No email provided"});

    db("users").where({email}).first()
    .then(user => {
        if (!user) return res.status(404).json({error: "User not found"});
        res.json(user); // send user data
    })
    .catch(err => res.status(500).json({error: "Database error"}));
})

app.post('/create-post', verifyToken, (req, res) => {
    const { title, content, image, price, productType } = req.body;
    const user = req.user; //from the token
    console.log(user.userid);
    if (!user) return res.status(400).json({error: "Invalid user"});

    if (!title) return res.status(400).json({error: "No title provided"});
    if (!price) return res.status(400).json({error: "No price provided"});
    if (!productType) return res.status(400).json({error: "No product type provided"});

    db("farmer_posts").insert({
        userid: user.id,
        title: title,
        image: image,
        content: content,
        price: price,
        product_type: productType,
    })
    .returning("*") // returning all the columns in the farmer_posts table of the current row
    .then(data => {
        console.log('success')
        res.json({postData: data[0], userData: user})
        // res.json(data[0]);
    })
})

app.listen(3000, (req, res) => {
    console.log('listening on port 3000.......')
})