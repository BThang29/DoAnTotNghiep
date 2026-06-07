SET NOCOUNT ON;

INSERT INTO dbo.BookingHistories
(
    booking_id,
    date_start,
    date_end,
    total_payment,
    special_request,
    feedback
)
SELECT
    b.id AS booking_id,
    b.date_start,
    b.date_end,
    NULL AS total_payment,
    NULL AS special_request,
    NULL AS feedback
FROM dbo.Bookings AS b
WHERE b.id IN (1, 3, 27, 28)
  AND NOT EXISTS
  (
      SELECT 1
      FROM dbo.BookingHistories AS bh
      WHERE bh.booking_id = b.id
  );
