/**
 * Author: Wendy Rzechula
 * Date: June 21, 2025
 * File: app.spec.js
 * Description: Chapter 3: API Tests
 */

const request = require("supertest"); // Supertest to simulate API calls
const app = require("../src/app"); // Import the Express app to test

// Test suite
describe("Chapter 3: API Tests", () => {

  // Test: should return an array of books
  it("should return an array of books", async() => {
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

  // Test: should return a single book by ID
  it("should return a single book when given a valid ID", async() => {
    const res = await request(app).get("/api/books/1");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("author");
  });

  // Test: should return an error for invalid ID
  it("should return a 400 error if the id is not a number", async() => {
    const res = await request(app).get("/api/books/abc");

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid book ID. Please provide a number");
  });
});

/**
 * SOURCES
 * Pragmatic APIs with NodeJS and Express; Richard Krasso; First Edition;
 * The Design of Web APIs; Arnaud Lauret; Manning Publications Co. 2019
 */