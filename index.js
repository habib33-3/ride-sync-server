import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import "dotenv/config";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();

const port = process.env.PORT || 5000;

const user = process.env.DB_USER;
const password = process.env.DB_PASS;
const secret = process.env.ACCESS_TOKEN;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ride-sync-66a08.web.app",
      "https://ride-sync-66a08.firebaseapp.com",
      "https://ride-sync-client.vercel.app",
    ],
    credentials: true,
  })
);

app.use(cookieParser());

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized" });
  }
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }

    req.user = decoded;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Server running....");
});

app.listen(port, () => {
  console.log(`Server running at ${port}`);
});

const uri = `mongodb+srv://${user}:${password}@cluster0.jamv2ck.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db("rideSyncDb");
    const serviceCollection = database.collection("service");
    const bookingCollection = database.collection("booking");

    app.post("/api/v1/addService", verifyToken, async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.get("/api/v1/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();

      res.send(result);
    });

    app.get("/api/v1/details/:id", verifyToken, async (req, res) => {
      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: "forbidden" });
      }

      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);

      res.send(result);
    });

    app.post("/api/v1/addBooking", async (req, res) => {
      const service = req.body;
      const result = await bookingCollection.insertOne(service);

      res.send(result);
    });

    app.post("/api/v1/createToken", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, secret, { expiresIn: "2d" });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.get("/api/v1/manageService", verifyToken, async (req, res) => {
      const email = req.query.email;

      if (email !== req.user.email) {
        return res.status(403).send({ message: "forbidden" });
      }

      const query = { providerEmail: email };

      const cursor = serviceCollection.find(query);

      const result = await cursor.toArray();

      res.send(result);
    });

    app.delete("/api/v1/deleteService/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await serviceCollection.deleteOne(query);

      res.send(result);
    });

    app.put("/api/v1/updateService/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedService = req.body;

      const service = {
        $set: {
          serviceImg: updatedService.updatedServiceImg,
          serviceName: updatedService.updatedServiceName,
          servicePrice: updatedService.updatedServicePrice,
          serviceDescription: updatedService.updatedServiceDescription,
          serviceArea: updatedService.updatedServiceArea,
        },
      };

      const result = await serviceCollection.updateOne(filter, service);
      res.send(result);
    });

    app.get("/api/v1/user/bookings", verifyToken, async (req, res) => {
      const email = req.query.email;

      if (email !== req.user.email) {
        return res.status(403).send({ message: "forbidden" });
      }

      const query = { userEmail: email };

      const cursor = bookingCollection.find(query);

      const result = await cursor.toArray();

      res.send(result);
    });

    app.get("/api/v1/provider/bookings", verifyToken, async (req, res) => {
      const email = req.query.email;

      if (email !== req.user.email) {
        return res.status(403).send({ message: "forbidden" });
      }

      const query = { providerEmail: email };

      const cursor = bookingCollection.find(query);

      const result = await cursor.toArray();

      res.send(result);
    });

    app.get("/api/v1/otherServices", async (req, res) => {
      const email = req.query.provider;
      const query = { providerEmail: email };
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/api/v1/logOut", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    app.put("/api/v1/booking/setStatus/:id", async (req, res) => {
      const id = req.params.id;
      const booking = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const updatedBooking = {
        $set: {
          status: booking.status,
        },
      };

      const result = await movies.updateOne(filter, updatedBooking, options);
      console.log(booking);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
