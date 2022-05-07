import type { NextApiRequest, NextApiResponse } from "next";

// type
import { ApiResponseOfPosts } from "@src/types";
import { getDummyPosts } from "@src/libs/dummy";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponseOfPosts>
) {
  const kinds = req.query.kinds as string;
  const page = +(req.query.page as string);

  res.status(200).json({ posts: getDummyPosts(kinds, page) });
}
