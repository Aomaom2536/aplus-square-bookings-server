app.post("/vapi/square/availability", async (req, res) => {
  try {
    const { date } = req.body || {};

    if (!date) {
      return res.status(400).json({
        error: "Missing required field",
        required: ["date"]
      });
    }

    const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
    const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
    const SQUARE_SERVICE_VARIATION_ID = process.env.SQUARE_SERVICE_VARIATION_ID;
    const SQUARE_VERSION = process.env.SQUARE_VERSION || "2023-10-18";

    const start = new Date(date);
    start.setHours(0,0,0,0);

    const end = new Date(date);
    end.setHours(23,59,59,999);

    const response = await fetch(
      "https://connect.squareup.com/v2/bookings/availability/search",
      {
        method: "POST",
        headers: {
          "Square-Version": SQUARE_VERSION,
          "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: {
            filter: {
              start_at_range: {
                start_at: start.toISOString(),
                end_at: end.toISOString()
              },
              location_id: SQUARE_LOCATION_ID,
              segment_filters: [
                {
                  service_variation_id: SQUARE_SERVICE_VARIATION_ID
                }
              ]
            }
          }
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Square availability failed",
        squareResponse: data
      });
    }

    const slots =
      data.availabilities?.map(a => ({
        startAt: a.start_at
      })) || [];

    return res.json({
      available: slots.length > 0,
      slots
    });

  } catch (err) {
    console.error("Availability error:", err);
    return res.status(500).json({
      error: "Availability check failed",
      message: err?.message
    });
  }
});
