const express = require('express')
const app = express()
const cors = require('cors')
const User = require('./database')
const { check, validationResult } = require('express-validator');
require('dotenv').config()



app.use(cors());
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const username = req.body.username;

  try {
    const newUser = new User({
      username: username,
      log: []  // Initialize log as empty array 
    });
    const savedUser = await newUser.save();
    const userId = savedUser._id;
    console.log('User created successfully:', userId.toHexString());
    
    res.json({
      username: username,
      _id: userId
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Posting exercise details
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id; 
  
  let { description, duration, date } = req.body;

  try {
    const foundUser = await User.findById(userId);
    
    if (!foundUser) {
      return res.status(404).json({error: 'There is no user with such id'});
    }

    if (isNaN(duration) || typeof description !== "string") {
      return res.status(400).json({error: 'Invalid duration or description'});
    }

    // If date is not provided, use current date
    const exerciseDate = date ? new Date(date) : new Date();

    foundUser.log.push({ description, duration: Number(duration), date: exerciseDate });
    await foundUser.save();
 
    
    res.json({
      _id: foundUser._id,
      username: foundUser.username,
      description,
      duration: Number(duration),
      date: exerciseDate.toDateString() 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({error: 'An error occurred while processing your request'});
  }
});

app.get('/api/users', (req, res) => {
  User.find()
  .then(users => {
    res.json(users);
  })
  .catch(err => {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });

  })
})


app.get('/api/users/:_id/logs', [
  check('from').optional().isDate(),
  check('to').optional().isDate(),
  check('limit').optional().isInt(),
], (req, res) => {
  let id = req.params._id;
  let { from, to, limit } = req.query;
  // We check if limit, from and to are provided
  // if not we assign them a great value accordinglly
  // so we don't have to handle each case separatelly
  const ourLimit = limit ? parseInt(limit) : 9000000;
  const ourFrom = from ? new Date(from) : new Date(0);
  const ourTo = to ? new Date(to) : new Date(6007199254740991);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

 User.findById(id)
  .then((user) => {
    // Date should always be greater than ourFrom and less than ourTo
    let filteredLogs = user.log.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= ourFrom && entryDate <= ourTo;
    });

    // Apply limit
    filteredLogs = filteredLogs.slice(0, ourLimit);    

    res.json({
      _id: user._id,
      username: user.username,
      count: filteredLogs.length,  // Adding count as per exercise tracker requirements
      log: filteredLogs.map(log => ({
        description: log.description,
        duration: log.duration,
        date: new Date(log.date).toDateString()
      }))
    });
  })
  .catch(err => {
    console.error('Error fetching user:', err);
    res.status(404).json({ error: 'User not found'});
  });


})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
