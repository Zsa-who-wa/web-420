/*
 * Author: Wendy Rzechula
 * Date: July 19, 2025
 * File: app.js
 * Description: Chapter 7: Enhancing API Security
 */

// Import require statements
const express = require("express");
const path = require("path");
const createError = require("http-errors");
const bcrypt = require("bcryptjs"); // Imports bcrypt.js
const books = require("../database/books"); // Imports books collection
const users = require("../database/users"); // Imports users collection
const Ajv = require("ajv");

const app = express(); // Creates an Express application
const port = process.env.PORT || 3000;
const ajv = new Ajv;

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
app.get("/api/books", async (req, res) => {
  try {
    const allBooks = await books.find(); // Gets all books from DB
    res.status(200).json(allBooks); // Send books as JSON
  } catch (err) {
    console.error(err);
    res.status(500).json({error: "An error occurred while fetching books."});
  }
});

// GET one book by ID
app.get("/api/books/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Check if the ID is not a number
    if (isNaN(id)) {
      return res.status(400).json({error: "Invalid book ID. Please provide a number"});
    }

    // If book is not found, returns 404 error
    const book = await books.findOne({ id });
    res.status(200).json(book); // Returns the found book
    } catch (err) {
    console.error("Error fetching book", err.message);
    if (err.message === "No matching item found") {
      return res.status(404).json({error: "Book not found."});
    }
    res.status(500).json({error: "An error occurred while fetching the book."});
  }
});

// POST route to ADD a new book
app.post("/api/books", async (req, res, next) => {
  try {
    const newBook = req.body;
    const requiredFields = ["id", "title", "author"];
    const keys = Object.keys(newBook);

    // Validates that all required fields are present
    if (
      !requiredFields.every(key => keys.includes(key)) ||
      keys.length !== requiredFields.length
    ) {
      return res.status(400).json({ error: "Bad Request: Missing required fields: id, title, author." });
    }

    const result = await books.insertOne(newBook);
    res.status(201).send({id: result.ops[0].id});
  } catch (err) {
    console.error("Error adding book ", err.message);
    next(err);
  }
});

// DELETE route to remove a book by ID
app.delete("/api/books/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await books.deleteOne({ id });
    res.status(204).send();
  } catch (err) {
    if (err.message === "No matching item found") {
      return res.status(404).json({ error: "Book not found"});
    }
    console.error("Error: ", err.message);
    next(err);
  }
});

// PUT route that updates a book by ID
app.put("/api/books/:id", async (req, res, next) => {
  try {
    let {id} = req.params;
    let book = req.body;
    id = Number(id);

    // Check if ID is not a number
    if (isNaN(id)) {
      return res.status(400).json({error: "Input must be a number"});
    }

    // Check if title is missing
    if (!book.title) {
      return res.status(400).json({error: "Bad Request: 'title' is required"});
    }

    const result = await books.updateOne({id}, book);
    res.status(204).send();
  } catch (err) {
    if (err.message === "No matching item found") {
      return res.status(404).json({error: "Book not found"});
    }
    console.error("Error: ", err.message);
    next(err);
  }
});

//POST to register a user
app.post("/api/register", async(req, res, next) => {
  console.log("Request body: ", req.body);
  try {
    const user = req.body;
    const expectedKeys = ["email", "password"];
    const receivedKeys = Object.keys(user);

    if(
      !receivedKeys.every(key => expectedKeys.includes(key)) ||
      receivedKeys.length !==expectedKeys.length
    ) {
      console.error("Bad Request: Missing keys or extra keys", receivedKeys);
      return next(createError(400, "Bad Request"));
    }

    let duplicateUser;
    try {
      duplicateUser = await users.findOne({email: user.email});
    } catch (err) {
      duplicateUser = null;
    }

    if (duplicateUser) {
      console.error("Conflict: User already exists");
      return next(createError(409, "Conflict"));
    }

    const hashedPassword = bcrypt.hashSync(user.password, 10);

    console.log("email: ", user.email);
    console.log("password: ", hashedPassword);

    const insertedUser = await users.insertOne({
      email: user.email,
      password: hashedPassword,
    });

    res.status(200).send({user: user, message: "Registration Successful"});
  } catch (err) {
    console.error("Error: ", err);
    next(err);
  }
});

//POST to login a user
app.post("/api/login", async(req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email or password is missing
    if(!email || !password) {
      return res.status(400).json({ message: "bad request"});
    }

    let foundUser;
    try {
      foundUser = await users.findOne({ email } );
    } catch (err) {
      foundUser = null;
    }

    if (!foundUser) {
      return res.status(401).json({message: "Unauthorized"});
    }

    const passwordMatch = bcrypt.compareSync(password, foundUser.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.status(200).json({ message: "Authentication Successful" });
  } catch(err) {
    console.error("Error: ", err);
    next(err);
  }
});

//POST to reset password
app.post("/api/users/:email/verify-security-question", async(req, res, next) => {
  try {
    const { email } = req.params;
    const { newPassword, securityQuestions } = req.body;

    const validate = ajv.compile(securityQuestionsSchema);
    const valid = validate(req.body);
    if (!valid) {
    console.error("Bad Request: Invalid request body", validate.errors);
    return next(createError(400, "Bad Request"));
  }

  const user = await users.findOne({ email });

  if(
    securityQuestions[0].answer !==user.securityQuestions[0].answer ||
    securityQuestions[1].answer !==user.securityQuestions[1].answer ||
    securityQuestions[2].answer !==user.securityQuestions[2].answer
  ) {
    console.error("Unauthorised: Security questions do not match");
    return res.status(401).json({message: "Unauthorized"});
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  user.password = hashedPassword;

  await users.updateOne({ email }, { password: hashedPassword });

  res.status(200).json({ message: "Security Questions Successfully Answered" });
  } catch(err) {
    console.error("Error verifying security questions", err.message);
    next(err);
  }
});

// JSON schema for validating password reset
const securityQuestionsSchema = {
  type: "object",
  properties: {
    newPassword: {type: "string"},
    securityQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          answer: {type: "string"}
        },
        required: ["answer"],
        additionalProperties: false
      }
    }
  },
  required: ["newPassword", "securityQuestions"],
  additionalProperties: false
};

//POST to reset password
app.post("/api/users/:email/reset-password", async(req, res, next) => {
  try {
    const {email} = req.params;
    const {newPassword, securityQuestions} = req.body;

    const validate = ajv.compile(securityQuestionsSchema);
    const valid = validate(req.body);
    if (!valid) {
      console.error("Bad Request: Invalid request body", validate.errors);
      return next(createError(400, "Bad Request"));
    }

    //Retrieve user by email
    const user = await users.findOne({email});

    // Check if security questions answers match
    if (
      securityQuestions[0].answer !== user.securityQuestions[0].answer ||
      securityQuestions[1].answer !== user.securityQuestions[1].answer ||
      securityQuestions[2].answer !== user.securityQuestions[2].answer
    ) {
      console.error("Unauthorized: Security questions do not match");
      return next(createError(401, "Unauthorized"));
    }

    // Hash new password and update user
    const hashPassword = bcrypt.hashSync(newPassword, 10);

    user.password = hashedPassword;
    await users.updateOne({email: email}, user);

    res.status(200).json({message: "Password Reset Successfully", user: user});
  } catch(err) {
    console.error("Error: ", err.message);
    next(err);
  }
});

//POST to verify security question
app.post("/api/users/:email/verify-security-question", async(req, res, next) => {
  try {
    const { email } = req.params;
    const { securityQuestions } = req.body;

    // AVJ schema for verifying security questions
    const Schema = {
      type: "object",
      properties: {
        securityQuestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              answer: {type: "string"}
            },
            required: ["answer"],
            additionalProperties: false
          }
        }
      },
      required: ["securityQuestions"],
      additionalProperties: false
    };

    const validate = ajv.compile(Schema);
    const valid = validate(req.body);

    if (!valid) {
      console.error("Bad Request: Invalid request body", validate.errors);
      return next(createError(400, "Bad Request" ));
    }

    const user = await users.findOne({ email: email });

    // Check security questions answers
    if(
      securityQuestions[0].answer !==user.securityQuestions[0].answer ||
      securityQuestions[1].answer !==user.securityQuestions[1].answer ||
      securityQuestions[2].answer !==user.securityQuestions[2].answer
    ) {
      console.error("Unauthorized: Security questions do not match");
      return next(createError(401, "Unauthorized" ));
    }

    res.status(200).json({ message: "Security Questions Successfully Answered", user: user });
  } catch(err) {
    console.error("Error: ", err.message);
    next(err);
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
