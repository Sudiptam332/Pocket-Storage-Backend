const conToMongo = require("./db");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

conToMongo();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/photos", require("./routes/photos"));
app.use("/api/docs", require("./routes/documents"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
