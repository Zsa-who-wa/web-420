/**
 * Author: Wendy Rzechula
 * Date: July 19, 2025
 * File: app.spec.js
 * Description: Chapter 7: Enhancing API Security
 */

const request = require("supertest"); // Supertest to simulate API calls
const app = require("../src/app");
const users = require("../database/users");
const bcrypt = require("bcryptjs");

// Chapter 3: API Tests
describe("Chapter 3: API Tests", () => {

  // Test: GET /api/books returns an array of books
  it("should return an array of books", async () => {
    const res = await request(app).get("/api/books");

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array); // Check if response is an array

    // Checks to see if each book has an id, title and author
    res.body.forEach((book) => {
      expect(book).toHaveProperty("id");
      expect(book).toHaveProperty("title");
      expect(book).toHaveProperty("author");
    });
  });

  // Test: GET /api/books/:id returns a single book by ID
  it("should return a single book when given a valid ID", async () => {
    const res = await request(app).get("/api/books/1");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("author");
  });

  // Test: should return an error for invalid ID
  it("should return a 400 error if the id is not a number", async () => {
    const res = await request(app).get("/api/books/abc");

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid book ID. Please provide a number");
  });
});

// Chapter 4: POST & DELETE route tests
describe("Chapter 4: API Tests", () => {

  // Test: POST - adds a book
  it("should return a 201 status code when adding a new books", async () => {
    const res = await request(app).post("/api/books").send({
      id: 17,
      title: "Cat in the Hat",
      author: "Dr Suess",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("id", 17);
  });

  // Test: books with missing title
  it("should return a 400 status code when adding a new book with missing title", async () => {
    const res = await request(app).post("/api/books").send({
      id: 18,
      author: "Dr Suess",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("error", "Bad Request: Missing required fields: id, title, author.");
  });

  // Test: DELETE /api/books/:id deletes a book
  it("should return a 204 status code when deleting a book", async () => {
    const res = await request(app).delete("/api/books/17");

    expect(res.statusCode).toEqual(204);
  });
});

// Chapter 5: API Tests
describe("Chapter 5: API Tests", () => {

  // TEST: should update a book and return a 204 status code
  it("should update a book and return a 204 status code", async () => {
    const res = await request(app).put("/api/books/1").send({
      title: "Fried Green Tomatoes",
      author: "Fannie Flagg"
    });

    expect(res.statusCode).toEqual(204);
  });

  // TEST: should return a 400 status code for non-numeric ID
  it("should return a 400 status code when using a non-numeric ID", async () => {
    const res = await request(app).put("/api/books/foo").send({
      title: "Invalid Update",
      author: "No Author"
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("error", "Input must be a number");
  });

  // TEST: should return 400 status code if title is missing
  it("should return a 400 status code when updating a book with a missing title", async () => {
    const res = await request(app).put("/api/books/2").send({
      author: "Fannie Flagg"
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("error", "Bad Request: 'title' is required");
  });

  // Chapter 6: API Tests
  describe("Chapter 6: API Tests", () => {

    // Test: should log a user in and return a 200 status with "Authentication Successful" message.
    it("should return a 200 status code with a message of 'Authentication Successful' when registering a new user", async () => {
      const res = await request(app).post("/api/login").send({
        email: "harry@hogwarts.edu",
        password: "potter"
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual("Authentication Successful");
    });

    // Test: should return a 401 status code with "Unauthorized" message when logging in with incorrect credentials.
    it("should return a 401 status code with Unauthorized message when logging in with incorrect credentials.", async () => {
      const res = await request(app).post("/api/login").send({
        email: "harry@hogwarts.edu",
        password: "wrongpassword"
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual("Unauthorized");
    });

    // Test: should return a 400 status code with "Bad Request" when missing email or password.
    it("should return a 400 status code with 'Bad Request' when missing email or password.", async () => {
      const res = await request(app).post("/api/login").send({
        email: "",
        password: "",
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual("bad request");

      const res2 = await request(app).post("/api/login").send({
        email: "harry@hogwarts.edu"
      });
      expect(res2.statusCode).toEqual(400);
      expect(res2.body.message).toEqual("bad request");
    });
  });

  // Chapter 7: API Tests
  describe("Chapter 7: API Tests", () => {
    // Password Reset API Test
    it("should return a 200 status code with 'Password Reset Successful' message.", async () => {
      const res = await request(app).post("/api/users/harry@hogwarts.edu/reset-password.").send({
        securityQuestions: [
          {answer: "Hedwig"},
          {answer: "Quidditch Through the Ages"},
          {answer: "Evans"}
        ],
        newPassword: "password"
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual("Password Reset Successful");
    });

    // Test: should return a 400 status code with 'Bad Request' message when the request body fails ajv validation.
    it("should return a 400 status code with a message of 'Bad Request' when the request body fails ajv validation.", async () => {
      const res = await request(app).post("/api/users/harry@hogwarts.edu/reset-password.").send({
        securityQuestions: [
          {answer: "Hedwig", question: "What is your pet's name?"},
          {answer: "Quidditch Through the Ages", myName: "Harry Potter"}
        ],
        newPassword: "password"
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual("Bad Request");
    });

    // Test: should return a 401 status code with 'Unauthorized' message when the security questions are incorrect
    it("should return a 401 status code with a message of 'Unauthorized' when the security questions are incorrect", async () => {
      const res = await request(app).post("/api/users/harry@hogwarts.edu/reset-password").send({
        securityQuestions: [
          {answer: "Fluffy"},  // wrong answer
          {answer: "Quidditch Through the Ages"},
          {answer: "Evans"},
        ],
        newPassword: "password"
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual("Unauthorized");
    });

    // Security Questions API Test
    it("should return a 200 status code with 'Security Questions Successfully Answered' message.", async () => {
      const res = await request(app).post("/api/users/harry@hogwarts.edu/verify-security-question.").send({
        securityQuestions: [
          {answer: "Hedwig"},
          {answer: "Quidditch Through the Ages"},
          {answer: "Evans"}
        ]
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual("Security Questions Successfully Answered");
    });

    // Test: should return a 400 status code with 'Bad Request' message when the request body fails ajv validation.
    it("should return a 400 status code with a message of 'Bad Request' when the request body fails ajv validation.", async () => {
      const res = await request(app).post("/api/users/harry@hogwarts.edu/verify-security-question.").send({
        securityQuestions: [
          {answer: "Hedwig", question: "What is your pet's name?"},
          {answer: "Quidditch Through the Ages", myName: "Harry Potter"}
        ]
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual("Bad Request");
    });

    // Test: should return a 401 status code with 'Unauthorized' message when security questions are wrong
    it("should return a 401 status code with 'Unauthorized' message when security questions are wrong", async () => {
      const res = await request(app).post("/api/users/harry@hogwarts.edu/verify-security-question").send({
        securityQuestions: [
          {answer: "Fluffy"},
          {answer: "Quidditch Through the Ages"},
          {answer: "Evans"},
        ]
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual("Unauthorized");
    });
  });
});


/**
 * SOURCES
 * Pragmatic APIs with NodeJS and Express; Richard Krasso; First Edition;
 * The Design of Web APIs; Arnaud Lauret; Manning Publications Co. 2019
 */