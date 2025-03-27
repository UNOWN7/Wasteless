require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const app = express();
app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const { sequelize, User, WasteItem, Company, Transaction } = require('./models');

const path = require('path');




app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));



app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


// Landing Page
app.get('/', (req, res) => {
  res.render('landing');
});

// Company Login API
app.get('/company/login', (req, res) => {
  res.render('company-login');
});

// User Registration Page
app.get('/register', (req, res) => {
  res.render('register');
});

// User Registration
app.post('/register', async (req, res) => {
  try {
      const { name, email, password, address } = req.body;

      
      const user = await User.create({ name, email, password, address });

      res.redirect('/login'); 
  } catch (error) {
      console.error(error);
      res.status(500).send('Error registering user');
  }
});

// User Login
app.get('/login', (req, res) => {
  res.render('login');
});


app.get('/logout', (req, res) => {
  res.render('landing');
});



app.post('/login', async (req, res) => {
  try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user || password !== user.password) { 
          return res.status(401).send('Invalid email or password');
      }

      
      res.redirect(`/dashboard?userId=${user.id}`);
  } catch (error) {
      console.error('User Login Error:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


// Dashboard Route 
app.get('/dashboard', async (req, res) => {
  try {
      const userId = req.query.userId; 

      if (!userId) {
          return res.status(400).send("User ID is required");
      }

      
      const user = await User.findByPk(userId);

      if (!user) {
          return res.status(404).send("User not found");
      }

     
      const wasteItems = await Transaction.findAll({
          where: { userId },
          include: [
              { model: WasteItem },
              { model: Company, attributes: ['name'] } 
          ]
      });

      res.render('dashboard', { user, wasteItems });

  } catch (error) {
      console.error("Error loading dashboard:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
  }
});




app.post('/update-profile', async (req, res) => {
  try {
      const { name, email, address } = req.body;
      await User.update({ name, email, address }, { where: { id: req.user.id } });
      res.redirect('/dashboard');
  } catch (error) {
      res.status(500).json({ message: 'Error updating profile', error });
  }
});

// Submit Waste
app.post('/submit-waste', async (req, res) => {
  try {
      const { type, quantity, address, userId } = req.body;

      
      console.log('Received Waste Data:', req.body);

      if (!type || !quantity || !address || !userId) {
          return res.status(400).json({ message: 'All fields are required' });
      }

      const userIdInt = parseInt(userId, 10);

      const waste = await WasteItem.create({
          type,
          quantity,
          address,
          userId: userIdInt, 
      });

      
      const transaction = await Transaction.create({
          userId: userIdInt,
          wasteId: waste.id,
          status: 'Pending'
      });

      res.json({ message: 'Waste submitted successfully!', waste, transaction });

  } catch (error) {
      console.error('Error submitting waste:', error);
      res.status(500).json({ message: 'Error submitting waste', error: error.message });
  }
});







function authenticateCompany(req, res, next) {
  if (req.session.companyId) {
      return next();
  }
  res.redirect('/company/login');
}

// Company Login API
app.get('/company/login', (req, res) => {
  res.render('company-login');
});

app.post('/company/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const company = await Company.findOne({ where: { email } });
        if (!company) return res.status(401).send("Company not found");

        if (company.password !== password) return res.status(401).send("Invalid password");

        
        req.session.companyId = company.id;

        res.redirect('/company/dashboard');
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// Company Logout
app.get('/company/logout', (req, res) => {
  req.session.destroy(() => {
      res.redirect('/company/login');
  });
});

// Company Registration API
app.get('/company', (req, res) => {
  res.render('company-register'); 
});

app.post('/company/register', async (req, res) => {
  try {
      const { name, email, password, location, contactNumber } = req.body;

      const existingCompany = await Company.findOne({ where: { email } });
      if (existingCompany) {
          return res.status(400).json({ message: 'Company already registered' });
      }

      
      const company = await Company.create({ name, email, password, location, contactNumber });

      res.redirect('/company/login'); 
  } catch (error) {
      res.status(500).json({ message: 'Error registering company', error });
  }
});


app.get("/company/dashboard", async (req, res) => {
    try {
        const companyId = req.query.companyId || req.body.companyId || req.session.companyId;
        
        if (!companyId) {
            return res.redirect("/company/login");
        }

        const pendingWaste = await Transaction.findAll({
            where: { status: "Pending" },
            include: [
                { model: WasteItem, attributes: ["id", "type", "quantity", "address", "status"] },
                { model: User, attributes: ["id", "name", "email"] }
            ],
        });

        const acceptedWaste = await Transaction.findAll({
            where: { status: "Accepted", companyId },
            include: [
                { model: WasteItem, attributes: ["id", "type", "quantity", "address", "status"] },
                { model: User, attributes: ["id", "name", "email"] }
            ],
        });

        const pickedUpWaste = await Transaction.findAll({ where: { status: "Picked Up", companyId }, include: [WasteItem, User] });


        const company = await Company.findByPk(companyId, { attributes: ["id", "name"] });

        res.render("company-dashboard", { pendingWaste, acceptedWaste, company, pickedUpWaste });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});






app.post("/company/accept-waste", async (req, res) => {
    try {
        console.log("Headers:", req.headers);  
        console.log("Raw Request Body:", req.body); 

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "Request body is empty. Check form submission." });
        }

        const { wasteId, companyId } = req.body;

        console.log("Received wasteId:", wasteId);
        console.log("Received companyId:", companyId);

        if (!wasteId || !companyId) {
            return res.status(400).json({ success: false, message: "Missing wasteId or companyId" });
        }

        await Transaction.update(
            { companyId, status: "Accepted" },
            { where: { wasteId, status: "Pending" } }
        );

        res.json({ success: true, message: "Waste Accepted!" });
    } catch (error) {
        console.error("Error in accepting waste:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});





app.post('/company/pickup-waste', async (req, res) => {
    try {
        const { wasteId } = req.body;
        if (!wasteId) {
            return res.status(400).json({ message: "Waste ID is required." });
        }

        const waste = await Transaction.findOne({ where: { wasteId } });
        if (!waste) {
            return res.status(404).json({ message: "Waste not found." });
        }

        // Update waste status and pickup time
        await waste.update({ status: "Picked Up", updatedAt: new Date() });

        return res.json({ message: "Waste picked up successfully!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});



app.listen(5000, async () => {
  await sequelize.sync();
  console.log('Backend running on port 5000');
});
