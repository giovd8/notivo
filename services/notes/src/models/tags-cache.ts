import mongoose, { Document, Model, Schema } from "mongoose";

export interface CachedTag {
  id: string;
  name: string;
  createdAt: Date;
}

export interface TagsCacheDocument extends Document {
  key: string; // singleton key, e.g., "global"
  tags: CachedTag[];
  updatedAt: Date;
}

const CachedTagSchema: Schema<CachedTag> = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const TagsCacheSchema: Schema<TagsCacheDocument> = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    tags: { type: [CachedTagSchema], required: true, default: [] },
    updatedAt: { type: Date, required: true, default: () => new Date() },
  },
  { collection: "tags_cache" }
);

TagsCacheSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const TagsCacheModel: Model<TagsCacheDocument> =
  mongoose.models.TagsCache ||
  mongoose.model<TagsCacheDocument>("TagsCache", TagsCacheSchema);

export default TagsCacheModel;


