db = db.getSiblingDB("admin");
db.createUser({
  user: "user",
  pwd: "pass",
  roles: [
    { role: "readWrite", db: "notivo" }
  ]
});

db = db.getSiblingDB("notivo");

db.createCollection("sessions");
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// db.sessions.insertOne({
//   _id: "session-1",
//   userId: "test-1",
//   token: "test-123",
//   createdAt: new Date(),
//   expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1h
//   metadata: {
//     ip: "127.0.0.1",
//     userAgent: "Mozilla/5.0",
//   },
// });


db.createCollection("users_cache");
db.users_cache.createIndex({ userId: 1 }, { unique: true });
db.users_cache.createIndex({ updatedAt: 1 });
// db.users_cache.insertMany([
//   { userId: "test-1", others: [
//     { id: "test-2", username: "user2", createdAt: new Date() },
//     { id: "test-3", username: "user3", createdAt: new Date() }
//   ], updatedAt: new Date() },
//   { userId: "test-2", others: [
//     { id: "test-1", username: "user1", createdAt: new Date() },
//     { id: "test-3", username: "user3", createdAt: new Date() }
//   ], updatedAt: new Date() },
//   { userId: "test-3", others: [
//     { id: "test-1", username: "user1", createdAt: new Date() },
//     { id: "test-2", username: "user2", createdAt: new Date() }
//   ], updatedAt: new Date() },
// ]);



db.createCollection("tags_cache");
db.tags_cache.createIndex({ key: 1 }, { unique: true });
// db.tags_cache.createIndex({ updatedAt: 1 });
// db.tags_cache.insertOne({
//   key: "global",
//   tags: [
//     { id: "seed-1", name: "work", createdAt: new Date() },
//     { id: "seed-2", name: "urgent", createdAt: new Date() }
//   ],
//   updatedAt: new Date()
// });

// User search cache: stores per-user search results with 24h TTL
db.createCollection("user_search_cache");
// Ensure unique key per user and TTL on lastUpdated
db.user_search_cache.createIndex({ userId: 1, key: 1 }, { unique: true });
db.user_search_cache.createIndex({ lastUpdated: 1 }, { expireAfterSeconds: 86400 });
// Example document shape:
// db.user_search_cache.insertOne({
//   userId: "123",
//   key: "progetto|lavoro",
//   filter: { text: "progetto", tags: ["lavoro"] },
//   results: [], // array of note
//   lastUpdated: new Date(),
// });
