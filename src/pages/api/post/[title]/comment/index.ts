import type { NextApiRequest, NextApiResponse } from "next";

// dummy-data
import { getComments } from "@src/libs/dummy";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "GET":
      console.log("특정 게시글의 댓글들 요청 >> ", req.query);

      return res.status(200).json({
        status: {
          ok: true,
        },
        data: {
          comments: getComments(+req.query.page),
        },
      });
    case "POST":
      console.log("댓글 생성 요청 >> ", req.query, req.body);

      return res.status(200).json({ ok: true, message: "댓글 생성 완료" });

    default:
      return res
        .status(400)
        .json({ ok: true, message: "/api/post 잘못된 요청" });
  }
}
