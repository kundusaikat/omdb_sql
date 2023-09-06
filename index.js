const express = require("express");
const app = express();
const port = 3000;
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const mysql = require("mysql");
const dbConfig = require("./config/db.config");

const db = mysql.createConnection(dbConfig);


db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    throw err;
  }
  console.log("Connected to MySQL database");

  
  db.query("CREATE DATABASE IF NOT EXISTS movie_favorites", (createDbErr) => {
    if (createDbErr) {
      console.error("Error creating database:", createDbErr);
      throw createDbErr;
    }

    db.query("USE movie_favorites", (useDbErr) => {
      if (useDbErr) {
        console.error("Error using database:", useDbErr);
        throw useDbErr;
      }

      const createTableSql = `
        CREATE TABLE IF NOT EXISTS favorites (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          year INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          poster VARCHAR(255) NOT NULL
        )
      `;

      db.query(createTableSql, (createTableErr) => {
        if (createTableErr) {
          console.error("Error creating table:", createTableErr);
          throw createTableErr;
        }
        console.log("Database and table are ready.");
      });
    });
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("search", { searchResults: null });
});

app.post("/search", (req, res) => {
  const searchQuery = req.body.searchQuery;

  axios
    .get(
      `http://www.omdbapi.com/?s=${searchQuery}&apikey=${process.env.OMDB_API_KEY}`
    )
    .then((response) => {
      const searchResults = response.data.Search || [];

      res.render("search", { searchResults });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error fetching search results.");
    });
});

app.post("/addFavorite", (req, res) => {
  const { title, year, type, poster } = req.body;
  const sql =
    "INSERT INTO favorites (title, year, type, poster) VALUES (?, ?, ?, ?)";
  db.query(sql, [title, year, type, poster], (err, result) => {
    if (err) {
      throw err;
    }
    console.log("Favorite movie added to the database");
    res.redirect("/");
  });
});

app.get("/favorites", (req, res) => {
  const sql = "SELECT * FROM favorites";
  db.query(sql, (err, results) => {
    if (err) {
      throw err;
    }
    res.render("favorites", { favorites: results });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
