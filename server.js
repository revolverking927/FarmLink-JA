const express = require('express'); //Express js is use to create server
const path = require('path'); //path allow the code to know the files locations
const bodyParser = require('body-parser'); //body-parser allow the code to send and recieve data
const knex = require('knex'); //knex will allow the cde to access the database(farmlink)
const jwt = require('jsonwebtoken');
const multer = require("multer");

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

const upload = multer({
    storage: multer.memoryStorage(), // store file in memory (for DB)
    limits: { fileSize: 5 * 1024 * 1024}, // max 5mb
})

const getDataByValues = async (table, column, values) => {
    return await knex(table)
        .select('*')
        .whereIn(column, values);
}

const verifyToken = (req, res, next) => {
    console.log("Begin user verification");
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided'});

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({error: 'Invalid token'});

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        console.log("checking token");
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
            const user = data[0];
            // Create a JWT token for authentication
            const token = jwt.sign(
            { id: user.id, email: user.email, firstname: user.firstname, lastname: user.lastname, parish: user.parish },
            SECRET_KEY,
            { expiresIn: '1h' }
            );

            // Send the user info and token to the frontend
            res.json({ userData: data[0], token });
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
      { id: user.id, email: user.email, firstname: user.firstname, lastname: user.lastname, parish: user.parish },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    user.marketplace_post_sessions = 0;

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

app.post('/create-post', verifyToken, upload.single("image"), async (req, res) => {
    const { title, content, price, productType } = req.body;
    const imageFile = req.file;
    const user = req.user; //from the token
    console.log(user);
    if (!user) return res.status(400).json({error: "Invalid user"});

    if (!title) return res.status(400).json({error: "No title provided"});
    if (!price) return res.status(400).json({error: "No price provided"});
    if (!productType) return res.status(400).json({error: "No product type provided"});

    // Convert file to base64 if you want to store in DB
    let imageData = null;
    if (imageFile) {
      imageData = imageFile.buffer.toString("base64");
    }
    console.log(imageFile, imageData);
 
    await db("farmer_posts").insert({
        userid: user.id,
        user_firstname: user.firstname,
        user_lastname: user.lastname,
        title: title,
        image: imageData,
        content: content,
        price: price,
        product_type: productType,
    })
    .returning("*") // returning all the columns in the farmer_posts table of the current row
    .then(data => {
        console.log('success')
        console.log(imageFile, imageData);
        res.json({postData: data[0], userData: user})
        // res.json(data[0]);
    })
})

app.post('/get-posts', (req, res) => {  
    const { pageNumber } = req.body;

    const limit = 10;
    const offset = (pageNumber - 1) * limit;

    //load the chunk of posts on 'x' page
    db('farmer_posts') 
        .select('*')
        .orderBy('postid')
        .limit(limit)
        .offset(offset)
    .then(data => {
        console.log(data);
        res.json(data)
    })
    .catch((err) => {
        res.status(500).json({error: 'Databse error'})
    });
})

app.get('/get-current-user-posts', verifyToken, async (req, res) => {
    const user = req.user;
    if (!user) return res.status(400).json({error: "Invalid user"});

    //returns an object of all the users posts
    db('farmer_posts')
        .select('*')
        .orderBy('postid')
        .where('userid', user.id)
    .then(data => {
        console.log(data);
        res.json(data);
    })
    .catch(err => {
        res.status(500).json({ error: "Failed to get users data"});
    });
})

app.delete('/delete-post/:id', verifyToken, async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "No postid provided" });

    const user = req.user;
    console.log("the user is " + user);
    if (!user) return res.status(400).json({ error: "Invalid user"});
    console.log('progress');
    try {
        // Delete post only if it belongs to the user
        const deletedCount = await db('farmer_posts') // deleted count tells how many rows were deletd
            .where({ userid: user.id, postid: id })
            .del();
        console.log('the deleted count is: ' + deletedCount);
        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Post not found or not yours' });
        }

        res.json({ message: 'Post deleted successfully', postId: id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
})

app.listen(3000, (req, res) => {
    console.log('listening on port 3000.......')
})