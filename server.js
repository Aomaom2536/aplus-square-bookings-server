app.post("/vapi/square/book", async (req, res) => {
  const toolCallId =
    req.body?.message?.toolCallList?.[0]?.id ||
    req.body?.toolCallId ||
    "unknown_tool_call";

  try {
    const args =
      req.body?.message?.toolCallList?.[0]?.arguments ||
      req.body ||
      {};

    const { startAt, customerName, customerPhone, notes } = args;

    if (!startAt || !customerName || !customerPhone) {
      return res.status(200).json({
        results: [
          {
            toolCallId,
            result: JSON.stringify({
              success: false,
              error: "Missing required fields",
              required: ["startAt", "customerName", "customerPhone"]
            })
          }
        ]
      });
    }

    const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
    const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
    const SQUARE_SERVICE_VARIATION_ID = process.env.SQUARE_SERVICE_VARIATION_ID;
    const SQUARE_VERSION = process.env.SQUARE_VERSION || "2023-10-18";
    const DURATION_MINUTES = Number(process.env.DURATION_MINUTES || 60);

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
              duration_minutes: DURATION_MINUTES
            }
          ],
          customer_note: notes || `Booked by AI for ${customerName} (${customerPhone})`
        }
      })
    });

    const data = await squareResponse.json().catch(() => ({}));

    return res.status(200).json({
      results: [
        {
          toolCallId,
          result: JSON.stringify({
            success: squareResponse.ok,
            squareStatus: squareResponse.status,
            booking: data.booking || null,
            response: data
          })
        }
      ]
    });
  } catch (err) {
    return res.status(200).json({
      results: [
        {
          toolCallId,
          result: JSON.stringify({
            success: false,
            error: err?.message || String(err)
          })
        }
      ]
    });
  }
});
