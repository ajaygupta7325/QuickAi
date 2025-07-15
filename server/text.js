import axios from 'axios'

axios.get("https://clipdrop-api.co")
  .then(() => console.log("✅ Connected"))
  .catch((err) => console.error("❌ Connection failed:", err.code));
