/**
 * Author: Wendy Rzechula
 * Date: July 4, 2025
 * File: app.spec.js
 * Description: Chapter 5: API Tests
 */

const request = require("supertest"); // Supertest to simulate API calls
const app = require("../src/app");

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
});

/**
 * SOURCES
 * Pragmatic APIs with NodeJS and Express; Richard Krasso; First Edition;
 * The Design of Web APIs; Arnaud Lauret; Manning Publications Co. 2019
 */