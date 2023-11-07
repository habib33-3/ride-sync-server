import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import "dotenv/config";

const app = express();

const port = process.env.PORT || 5000;

const user = process.env.DB_USER;
const password = process.env.DB_PASS;

app.use(express.json());
app.use(cors());

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

    app.post("/api/v1/addService", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.get("/api/v1/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();

      res.send(result);
    });

    app.get("/api/v1/details/:id", async (req, res) => {
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
