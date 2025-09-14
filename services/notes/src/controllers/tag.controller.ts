import { Request, Response } from "express";
import { NotivoResponse } from "../models/response";
import { TagEntity, TagsRequestDTO } from "../models/tag";
import repo from "../repositories/tag.repository";
import { ServerError } from "../utils/server-error";

const createMany = async (
  req: Request<{}, {}, TagsRequestDTO>,
  res: Response<NotivoResponse<TagEntity[]>>
) => {
  try {
    const tags = Array.isArray(req.body?.tags) ? req.body.tags : [];
    if (tags.length === 0) {
      throw new ServerError("tags array is required", 400)
    }
    const created = await repo.upsertTags(tags);
    return res.status(201).json({ message: 'Tags upserted', data: created });
  } catch (err: any) {
      throw new ServerError(err?.message, err?.status);
  }
};

const list = async (
  _req: Request,
  res: Response<NotivoResponse<TagEntity[]>>
) => {
  try {
    const tags = await repo.listTags();
    return res.status(200).json({ message: 'Tags', data: tags });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

export default { createMany, list };


