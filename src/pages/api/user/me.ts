import type { NextApiRequest, NextApiResponse } from "next";

import { getMe } from "@src/libs/dummy";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ok: true, user: getMe() });
}