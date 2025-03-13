import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // Ensure node-fetch v3 is installed

const app = express();
const PORT = process.env.PORT || 5173; // Use a different port

app.use(cors());

app.get("/proxy", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ error: "No image URL provided" });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const contentType = response.headers.get("content-type");
    res.setHeader("Content-Type", contentType);

    response.body.pipe(res); // Stream image
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
