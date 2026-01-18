const http = require("http");

const data =
  '{"firstname":"John", "lastname":"Doe", "email":"test@example.com", "password":"123", "phone": 0123456789}'; // Invalid JSON (octal/leading zero)

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/users",
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

// Write data to request body
req.write(data);
req.end();
