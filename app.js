/*********************************************************************************************** */
//Dependencies

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const { engine } = require("express-handlebars");
const MongoClient = require("mongodb").MongoClient;

/*********************************************************************************************** */
const app = express();
const port = process.env.PORT;
const connectionString = process.env.DB_STRING;
const client = new MongoClient(connectionString);

/*********************************************************************************************** */
// Setting up Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

/*********************************************************************************************** */
// Middleware
app.use(session({ secret: "keyboard cat", cookie: { maxAge: 60000 } }));
app.use(bodyParser.urlencoded({ extended: true }));

/*********************************************************************************************** */
// Connecting to the database
client
  .connect()
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
    process.exit(1); // Exit the process if the database connection fails
  });

/*********************************************************************************************** */

//Database Operations
async function fetchUser(database, collection, constraints) {
  try {
    const db = client.db(database);
    const user = await db.collection(collection).findOne(constraints);
    return user || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

async function createUser(database, collection, userDetails) {
  try {
    const db = client.db(database);
    await db.collection(collection).insertOne(userDetails);
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

/******************************************************************************** */
/**Routes */

// Home Route
app.get("/", (req, res) => {
  res.render("landingpage");
});

// Create Account Routes
app.get("/createaccount", (req, res) => {
  res.render("createaccount");
});

app.post("/create-account-submit", async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    const user = await fetchUser("login-page", "user-details", {
      email,
      username
    });

    if (user) {
      res.render("createaccount", {
        message: "Account already exists.",
        color: "text-red-600",
      });
    } else {
      await createUser("login-page", "user-details", {
        name,
        username,
        email,
        password,
        role: "user",
      });
      res.render("createaccount", {
        message: "Account created successfully.",
        color: "text-green-600",
      });
    }
  } catch (error) {
    console.error("Error processing account creation:", error);
    res.render("createaccount", {
      message: "An error occurred. Please try again.",
      color: "text-red-600",
    });
  }
});

// Login Routes
app.get("/loginpage", (req, res) => {
  res.render("loginpage");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await fetchUser("login-page", "user-details", {
      email,
      password,
    });

    if (user) {
      const name = user.name;
      if (user.role === "admin") {
        res.render("admin", { name });
      } else {
        res.render("user", { name });
      }
    } else {
      res.render("loginpage", {
        error: "Invalid username or password. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.render("loginpage", {
      error: "An error occurred. Please try again later.",
    });
  }
});

// 404 Page Not Found
app.get("*", (req, res) => {
  res.status(404).send("<h1>Error 404 - Page not found</h1>");
});

/********************************************************************************************* */
//start the server

app.listen(port, function () {
  console.log(`Server is running on ${port}`);
});

/*********************************************************************************************** */
