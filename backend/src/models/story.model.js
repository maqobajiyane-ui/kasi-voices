// MongoDB document shape (plain driver, no ORM).
export function publishedStorySummary(doc) {
  return {
    id: doc.clientStoryId,
    title: doc.title,
    durationMs: doc.durationMs,
    bytes: doc.bytes,
    mimeType: doc.mimeType,
    pin: doc.pin || null,
    publishedAt: doc.publishedAt,
  };
}
