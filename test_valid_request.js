const http = require("http");

// VALID JSON payload
const data = JSON.stringify({
  firstname: "Test",
  lastname: "User",
  email: `validtest${Date.now()}@example.com`,
  password: "password123",
  phone: "08012345678", // String, valid
});

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/users", // Note: Check if it's /api/users or /api/user based on routes
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    console.log("BODY:");
    console.log(body);
  });
});

req.on("error", (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
