import express from "express";
import appRoutes from "./routes";
import cors from "cors";

const app = express();
const port = process.env.PORT || 8000;

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(appRoutes);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
