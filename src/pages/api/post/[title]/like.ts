import type { NextApiRequest, NextApiResponse } from "next";

// dummy-data
import { getLikers } from "@src/libs/dummy";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { title } = req.query;

  switch (method) {
    case "GET":
      console.log("특정 게시글에 좋아요 누른 사람들 정보 정보 요청 >> ", title);

      return res.status(200).json({
        status: {
          ok: true,
        },
        data: {
          likers: getLikers(),
        },
      });
    case "POST":
      console.log("특정 게시글에 좋아요 추가 >> ", title);

      return res.status(200).json({ status: { ok: true } });
    case "DELETE":
      console.log("특정 게시글에 좋아요 제거 >> ", title);

      return res.status(200).json({ status: { ok: true } });

    default:
      return res
        .status(400)
        .json({ ok: true, message: "/api/post 잘못된 요청" });
  }
}
