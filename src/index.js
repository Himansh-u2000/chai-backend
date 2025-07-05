import { PORT } from "./constants.js"
import connectDB from "./db/index.js";
import { app } from "./app.js"

connectDB()
  .then(() => {
    app.listen(PORT || 8000, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("Error in connecting Mongo DB: ", err)
  });
