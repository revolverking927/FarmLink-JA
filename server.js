const express = require('express'); //Express js is use to create server
const path = require('path'); //path allow the code to know the files locations
const bodyParser = require('body-parser'); //body-parser allow the code to send and recieve data
const knex = require('knex'); //knex will allow the cde to access the database(farmlink)
const jwt = require('jsonwebtoken');
const multer = require("multer");
const axios = require('axios');

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

const verifyAddress = async (req, res, next) => {

 try {
    console.log('Making attempt');
    const { street = '', city = '', parish = '', country = 'Jamaica' } = req.body || {};
    console.log(req.body)
    if (!street && !city && !parish) {
      return res.status(400).json({ valid: false, message: 'Provide at least street, city or parish' });
    }

    const q = [street, city, parish, country].filter(Boolean).join(', ');

    // --- Nominatim forward geocode ---
    // See usage policy: https://operations.osmfoundation.org/policies/nominatim/
    // Use a custom user-agent & email as required by policy.
    const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
    const nominatimParams = {
      q,
      format: 'json',
      addressdetails: 1,
      limit: 5,
      countrycodes: 'jm' // optional: restrict to Jamaica (jm)
    };
console.log("error found")
    const nomRes = await axios.get(nominatimUrl, {
        params: nominatimParams,
        headers: {
            'User-Agent': 'FarmLinkJA/1.0 (contact@farmlinkja.com)'
            },

        timeout: 8000
    });
    
    const results = nomRes.data || [];
    //console.log(results)
    if (!results.length) {
      // Optional fallback: try OpenCage if you have API key (uncomment below)
      return res.json({ valid: false, message: 'Address not found' });
    } else {
        // Inspect top result (best match) and also try to find a result inside Jamaica
        let best = results[0];
        //const lat = parseFloat(best.lat);
        //const lon = parseFloat(best.lon);
        // prefer a result whose address.country_code == 'jm'
        const jmCandidate = results.find(r => r.address && (r.address.country_code === 'jm' || normalize(r.address.country) === 'jamaica'));
        if (jmCandidate) best = jmCandidate;

        const addr = best.address || {};
        const formatted = best.display_name;
        const lat = parseFloat(best.lat);
        const lon = parseFloat(best.lon);

        // Check country is Jamaica
        const countryMatches = addr.country && normalize(addr.country) === 'jamaica';
        if (!countryMatches) {
            // Not Jamaica -> invalid for your use case
            return res.json({ valid: false, reason: 'Not in Jamaica', found: formatted, location: { lat, lon }, address: addr });
        }

        // Now check parish (ADM1) — GeoBoundaries uses 'state' or 'county' fields sometimes.
        // Try common properties: county, state, state_district, region, parish
        const parishCandidates = [
            addr.county,
            addr.state,
            addr.region,
            addr.state_district,
            addr.parish,
            addr.suburb // sometimes smaller unit
        ].filter(Boolean);

        // city candidates
        const cityCandidates = [
            addr.city,
            addr.town,
            addr.village,
            addr.hamlet,
            addr.suburb,
            addr.locality
        ].filter(Boolean);

        // If user provided parish, require match
        let parishOk = true;
        if (parish) {
            parishOk = parishCandidates.some(p => matches(parish, p));
        }

        // If user provided city, require match
        let cityOk = true;
        if (city) {
            cityOk = cityCandidates.some(c => matches(city, c));
        }
        console.log(parishOk, cityOk);
        // Final decision
        const valid = parishOk && cityOk;

        //   req.address = {
        //     valid,
        //     reason: valid ? 'ok' : 'mismatch',
        //     found: { formatted, lat, lon, address: addr, raw: best },
        //     checks: { parishOk, cityOk, parishCandidates, cityCandidates }
        //   };
        req.coordinates = {latitude: lat, longitude: lon};
        req.address = addr;
        req.requested_address = { street, city, parish, country },
        req.formatted_address = formatted;
        console.log("The address and requested address is", req.address, req.requested_address);
        next();
    }


    // If we reach here, no match
    // return res.json({ valid: false, message: 'Address not validated (no results)' });
  } catch (err) {
    console.error('verify-address error:', err.message || err);
    return res.status(500).json({ valid: false, message: 'Server error' });
  }
};
let initialPath = path.join(__dirname, "public");

app.use(bodyParser.json());
app.use(express.static(path.join(initialPath)));

app.get('/', (req, res) => {
    res.sendFile(path.join(initialPath, "index.html"));
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(initialPath, "login.html"));
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(initialPath, "register.html"));
})

app.post('/register-user', verifyAddress, (req, res) => {
    // console.log(req.address);
    //gives access to the variables in the request
    const {firstname, lastname, email, password, role} = req.body; 
    const address = req.address;
    const requested_address = req.requested_address;
    const coordinates = req.coordinates;
    const formatted_address = req.formatted_address;

    if (!firstname.length || !lastname.length || !email.length || !password.length || !role.length) {
        res.json('fill all the fields');
    } else {
        db("users").insert({
            firstname,
            lastname,
            email,
            password, 
            address,
            requested_address,
            formatted_address,
            role,
            lat: coordinates.latitude,
            lon: coordinates.longitude
        })
        .returning(["*"]) // returning all the columns in the users table of the current row
        .then(data => {
            const user = data[0];
            // Create a JWT token for authentication
            const token = jwt.sign(
            { user_id: user.user_id, email: user.email, firstname: user.firstname, lastname: user.lastname, role: user.role, address: user.address, requested_address: user.requested_address },
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


    // const user = data[0];
    // Create a JWT token for authentication
    const token = jwt.sign(
    { user_id: user.user_id, email: user.email, firstname: user.firstname, lastname: user.lastname, role: user.role, address: user.address, requested_address: user.requested_address },
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

app.post('/create-post', verifyToken, /*upload.single("image"),*/ async (req, res) => {
  try {
    console.log(req.body);
    const { title, content, price, productType } = req.body;
    // const imageFile = req.file;
    const user = req.user;
    console.log(user);
    if (!user) return res.status(400).json({ error: "Invalid user" });
    if (!title || !price || !productType) return res.status(400).json({ error: "Missing required fields" });

    // const imageData = imageFile ? imageFile.buffer.toString("base64") : null;
    console.log(title, content, price, productType);
    const newPost = await db("farmer_posts")
      .insert({
        user_id: user.user_id,
        title,
        // image: imageData,
        content: content /*|| null*/,
        price,
        product_type: productType
      })
      .returning("*");

    res.json({ postData: newPost[0], userData: user });
      console.log(newPost);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});


app.get('/get-posts', (req, res) => {  
    // const { pageNumber } = req.body;

    // const limit = 10;
    // const offset = (pageNumber - 1) * limit;

    //load the chunk of posts on 'x' page
    db('farmer_posts') 
        .select('*')
        .orderBy('post_id')
        //.limit(limit)
        //.offset(offset)
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
        .orderBy('post_id')
        .where('user_id', user.user_id)
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
            .where({ user_id: user.user_id, post_id: id })
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

app.post('/post-goods', verifyToken, async (req, res) => {
    const user = req.user;
    if (!user) return res.status(400).json({ error: "Invalid user" });

    const {item_name, price, description} = req.body;
    if (!item_name || !price ) return res.status(400).json({ error: "One or more fields are required"});
    
    // Ensure price is an integer
    const priceInt = parseInt(price, 10);
    if (isNaN(priceInt)) {
        return res.status(400).json({ error: "Price must be a number" });
    }

    db('goods').insert({
        user_id: user.user_id,
        item_name,
        price: priceInt,
        description,
        //user_firstname: user.firstname,
        //user_lastname: user.lastname,
    })
    .returning('*')
    .then(data => {
        console.log('Data saved', data[0]);
        res.json(data[0]);
    })
    .catch(err => {
        res.status(500).json({ error: "Failed to insert data"});
    })
})

app.get('/get-current-user-goods', verifyToken, async (req, res) => {
    const user = req.user;
    if (!user) return res.status(400).json({ error: 'Invalid user'});

    const goodsData = []; //an array to hold the combined data of each user and goods
    db('goods')
        .select('*')
        .where('user_id', user.user_id)
        .orderBy('list_id')
    .then(data => {
        console.log('Data found', data);
        //goodsData.push(data[0].concat(user));
        res.json(data);
    })
})

app.get('/get-all-goods', verifyToken, async (req, res) => {
    // try {
    await db('goods')
        .join('users', 'goods.user_id', 'users.user_id')
        .select(
            'goods.list_id',
            'goods.item_name',
            'goods.price',
            'goods.description',
            'users.firstname',
            'users.lastname',
            'users.lat',
            'users.lon'
        )
    .orderBy('list_id')
    .then(data => {
        res.json(data);
    })
    .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch goods' });
    });

});

// Save a good for the current user
app.post('/save-good/:list_id', verifyToken, async (req, res) => {
    const user = req.user;  // buyer
    const list_id = parseInt(req.params.list_id);

    if (!user) return res.status(400).json({ error: "Invalid user" });
    if (!list_id) return res.status(400).json({ error: "No good specified" });

    try {
        // Insert into saved_goods
        const saved = await db('saved_goods')
            .insert({
                buyer_user_id: user.user_id,
                good_list_id: list_id,
            })
            .onConflict(['buyer_user_id', 'good_list_id']) // avoid duplicates
            .ignore()
            .returning('*');

        res.json({ message: 'Good saved successfully', saved: saved[0] || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save good' });
    }
});

app.get('/get-saved-goods', verifyToken, async (req, res) => {
    const user = req.user;
    if (!user) return res.status(400).json({ error: "Invalid user" });

    try {
        const savedGoods = await db('saved_goods')
            .join('goods', 'saved_goods.good_list_id', 'goods.list_id')
            .join('users', 'goods.user_id', 'users.user_id') // get seller info
            .select(
                'saved_goods.saved_id',
                'goods.list_id',
                'goods.item_name',
                'goods.price',
                'goods.description',
                'users.firstname',    // seller's firstname
                'users.lastname',     // seller's lastname
                'users.formatted_address',
                // 'users.parish',
                'users.lat',
                'users.lon'
            )
            .where('saved_goods.buyer_user_id', user.user_id) // ✅ make sure this matches POST
            .orderBy('saved_goods.saved_at', 'desc');

        return res.json(savedGoods);
    } catch (err) {
        console.error("GET SAVED GOODS ERROR:", err);
        return res.status(500).json({ error: "Failed to get saved goods" });
    }
});




app.delete('/remove-saved-good/:saved_id', verifyToken, async (req, res) => {
    const savedId = req.params.saved_id;
    const user = req.user;

    console.log("DELETE REQ PARAM:", savedId);
    console.log("TOKEN USER:", user);

    try {
        const deletedCount = await db('saved_goods')
            .where({ saved_id: savedId, buyer_user_id: user.user_id })
            .del();

        if (deletedCount === 0) {
            return res.status(404).json({ error: "Saved good not found or not yours" });
        }

        res.json({ message: "Saved good removed successfully", saved_id: savedId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to remove saved good" });
    }
});


/**
 * Normalize strings for comparison
 */
function normalize(s = '') {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check whether candidateName matches one of expected names (fuzzy, normalized)
 */
function matches(expected, candidate) {
  if (!candidate) return false;
  const e = normalize(expected);
  const c = normalize(candidate);
  if (!e || !c) return false;
  // exact normalized match OR candidate contains expected OR expected contains candidate
  return c === e || c.includes(e) || e.includes(c);
}



app.listen(3000, (req, res) => {
    console.log('listening on port 3000.......')
})