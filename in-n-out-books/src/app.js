/*
 * Author: Wendy Rzechula
 * Date: June 15, 2025
 * File: app.js
 * Description: entry point for In-N-Out-Books Express Service
 */

// Require statements
const express = require("express");
const path = require("path");

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

// Handle 404 errors
app.use((req, res) => {
  res.status(404).send("Sorry, page not found");
});

// Handle 500 errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong on the server!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});