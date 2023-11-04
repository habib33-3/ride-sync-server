import express from "express";
import cors from "cors";

const app = express();

const port = process.env.PORT || 5000;



app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Server running....");
});

app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
