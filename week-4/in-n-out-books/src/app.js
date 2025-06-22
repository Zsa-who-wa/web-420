/*
 * Author: Wendy Rzechula
 * Date: June 21, 2025
 * File: app.js
 * Description: entry point for In-N-Out-Books Express Service
 */

// Import require statements
const express = require("express");
const path = require("path");
const books = require("../database/books"); // Imports book collection

const app = express(); // Creates an Express application
const port = process.env.PORT || 3000;

// Middleware for JSON and URL encoded data
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "../public")));

// Middleware to log request method and URL
app.use((req, res, next) => {
  console.log(`Request method: ${req.method}, Request URL: ${req.url}`);
  next();
});

// GET route for landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// GET route to return all books
app.get('/api/books', async (req, res) => {
  try {
    const allBooks = await books.find(); // Gets all books from DB
    res.status(200).json(books.data); // Send books as JSON
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'An error occurred while fetching books.'});
  }
});

// GET route to return one book by ID
app.get("/api/books/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Check if the ID is not a number
    if (isNaN(id)) {
      return res.status(400).json({error: "Invalid book ID. Please provide a number"});
    }

    const book = await books.findOne({ id });

    // If book is not found, returns 404 error
    if (!book) {
      return res.status(404).json({error: "Book not found."});
    }

    res.status(200).json(book); // Returns the found book
  } catch (err) {
    console.error("Error fetching book", err.message);
    res.status(500).json({error: "An error occurred while fetching the book."});
  }
});

// 404 error handler for unmatched route
app.use((req, res) => {
  res.status(404).send("Sorry, page not found");
});

// 500 error handler for server errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong on the server!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Export app for use in testing
module.exports = app;

/**
 * SOURCES
 * Pragmatic APIs with NodeJS and Express; Richard Krasso; First Edition;
 * The Design of Web APIs; Arnaud Lauret; Manning Publications Co. 2019
 */