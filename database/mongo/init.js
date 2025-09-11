db = db.getSiblingDB("user_cache");

db.createCollection("sessions");
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.sessions.insertOne({
  _id: "session-1",
  userId: "test-1",
  token: "test-123",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1h
  metadata: {
    ip: "127.0.0.1",
    userAgent: "Mozilla/5.0",
  },
});

db.createCollection("note_cache");
db.note_cache.createIndex({ title: "text", body: "text" });
db.note_cache.createIndex({ tags: 1 });
db.note_cache.createIndex({ ownerId: 1 });
db.note_cache.createIndex({ sharedWith: 1 });
db.note_cache.insertOne({
  _id: "note-1",
  ownerId: "test-1",
  title: "Nota di test",
  body: "Contenuto della prima nota di test",
  tags: ["work", "urgent"],
  sharedWith: ["test-2", "test-3"],
  indexedAt: new Date(),
});
