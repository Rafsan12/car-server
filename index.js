const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      "https://cars-two-iota.vercel.app",
      "https://cars-git-main-rafsan-s-projects.vercel.app",
      "https://cars-eo00mbvwj-rafsan-s-projects.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0veqj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const logger = async (req, res, next) => {
  console.log("called", req.host, req.originalUrl);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token; // Extract token from cookies
  console.log("Value of token:", token);

  if (!token) {
    // If no token is found, respond with 401 Unauthorized
    return res.status(401).send({ message: "Not Authorized" });
  }

  jwt.verify(token, process.env.Access_Token_secret, (err, decoded) => {
    if (err) {
      // Log the error and respond with 401 Unauthorized if verification fails
      console.log("JWT Verification Error:", err);
      return res.status(401).send({ message: "Not Authorized" });
    }

    console.log("Value of decoded token:", decoded);
    req.user = decoded; // Optionally attach decoded token to `req` object for later use
    next(); // Proceed to the next middleware
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // auth jws
    // console.log("Access Token Secret:", process.env.Access_Token_secret);
    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.Access_Token_secret, {
        expiresIn: "1h",
      });
      console.log(token);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("Login User: ", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    // collection
    const serviceCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("bookings");

    // services api
    app.get("/services", logger, async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };
      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    });

    //  booking
    app.get("/booking", logger, verifyToken, async (req, res) => {
      console.log(req.query.email);
      // console.log("Token: ", req.cookies.token);
      console.log("for valid token: ", req.user);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("server running");
});

app.listen(port, () => {
  console.log(`port is running ${port}`);
});

// carDoc
// 9e7OtF6Rs3FMHaXZ
