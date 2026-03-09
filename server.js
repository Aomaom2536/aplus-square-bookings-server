import express from "express";

const app = express();
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.status(200).send("ok");
});

// Browser test route
app.get("/square/book", (_req, res) => {
  res
    .status(200)
    .send("Square booking endpoint is live. Use POST /vapi/square/book to create a booking.");
});

// Booking endpoint
app.post("/vapi/square/book", async (req, res) => {
  try {
    const { startAt, customerName, customerPhone, notes } = req.body || {};

    if (!startAt || !customerName || !customerPhone) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["startAt", "customerName", "customerPhone"]
      });
    }

    const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
    const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
    const SQUARE_SERVICE_VARIATION_ID = process.env.SQUARE_SERVICE_VARIATION_ID;
    const SQUARE_VERSION = process.env.SQUARE_VERSION || "2023-10-18";

    const squareResponse = await fetch("https://connect.squareup.com/v2/bookings", {
      method: "POST",
      headers: {
        "Square-Version": SQUARE_VERSION,
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        booking: {
          location_id: SQUARE_LOCATION_ID,
          start_at: startAt,
          appointment_segments: [
            {
              service_variation_id: SQUARE_SERVICE_VARIATION_ID,
              duration_minutes: 60
            }
          ],
          customer_note: notes || `Booked by AI for ${customerName} (${customerPhone})`
        }
      })
    });

    const data = await squareResponse.json().catch(() => ({}));

    if (!squareResponse.ok) {
      return res.status(squareResponse.status).json({
        error: "Square booking failed",
        squareResponse: data
      });
    }

    return res.status(200).json({
      success: true,
      booking: data.booking || data
    });

  } catch (err) {
    console.error("Booking error:", err);
    return res.status(500).json({
      error: "Server error",
      message: err?.message || String(err)
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`A-Plus Air booking server running on port ${PORT}`);
});
