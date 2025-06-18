// Require statements
const express = require("express");

// Create an Express application
const app = express();

// Define the middleware configurations
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define the port number
const port = process.env.PORT || 3000;

// Define the routes
app.get("/", (req, res, next) => {
res.send("Hello World!");
});

// Start the server
app.listen(port, () => {
console.log(`Server is running on port ${port}`);
});
