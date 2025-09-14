import mongoose, { Document, Model, Schema } from "mongoose";

export interface UserNotesCacheDocument extends Document {
  userId: string;
  noteIds: string[];
  updatedAt: Date;
}

const UserNotesCacheSchema: Schema<UserNotesCacheDocument> = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    noteIds: { type: [String], required: true, default: [] },
    updatedAt: { type: Date, required: true, default: () => new Date() },
  },
  { collection: "user_notes_cache" }
);

UserNotesCacheSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const UserNotesCacheModel: Model<UserNotesCacheDocument> =
  mongoose.models.UserNotesCache ||
  mongoose.model<UserNotesCacheDocument>("UserNotesCache", UserNotesCacheSchema);

export default UserNotesCacheModel;


