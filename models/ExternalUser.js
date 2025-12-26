const mongoose = require("mongoose");

const ExternalUserSchema = new mongoose.Schema({
  User_ID: Number,
  Dep_ID: Number,
  Username: String,
  Role: String,

  deleted_at: { type: Date, default: null },
  syncedAt: { type: Date, default: Date.now }
});

// TTL: ลบหลัง 14 วัน
ExternalUserSchema.index(
  { syncedAt: 1 },
  { expireAfterSeconds: 14 * 24 * 60 * 60 }
);

module.exports = mongoose.model("ExternalUser", ExternalUserSchema);

