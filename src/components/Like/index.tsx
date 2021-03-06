import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useSWR from "swr";

// common-compopnent
import Icon from "@src/components/common/Icon";

// hook
import useMe from "@src/hooks/useMe";
import useMutation from "@src/hooks/useMutation";

// util
import { combineClassNames } from "@src/libs/util";

// type
import { ICON } from "@src/types";
import type { ResponseStatus } from "@src/types";
import type { SimpleUser } from "@src/types";

type ResponseOfLikers = {
  status: ResponseStatus;
  data: {
    likers: SimpleUser[];
  };
};

const Like = () => {
  const router = useRouter();
  const { me } = useMe();

  // 2022/05/03 - 게시글 좋아요 누른 유저 정보 요청 - by 1-blue
  const { data: likerResponse, mutate: likerMutate } = useSWR<ResponseOfLikers>(
    router.query.title ? `/api/post/${router.query.title}/like` : null
  );
  // 2022/05/03 - 게시글 좋아요 추가관련 메서드 - by 1-blue
  const [addLike, { loading: addLikeLoading }] = useMutation({
    url: `/api/post/${router.query.title}/like`,
    method: "POST",
  });
  // 2022/05/03 - 게시글 좋아요 제거관련 메서드 - by 1-blue
  const [removeLike, { loading: removeLikeLoading }] = useMutation({
    url: `/api/post/${router.query.title}/like`,
    method: "DELETE",
  });
  // 2022/05/03 - 본인이 좋아요 눌렀는지 여부 - by 1-blue
  const [isMineLiked, setIsMineLiked] = useState(false);
  // 2022/05/03 - 본인 좋아요 초기화 - by 1-blue
  useEffect(() => {
    if (likerResponse?.status.ok) {
      setIsMineLiked(
        !!likerResponse.data.likers.find((liker) => liker.idx === me?.idx)
      );
    }
  }, [likerResponse, setIsMineLiked, me]);
  // 2022/05/03 - 좋아요 버튼 클릭 이벤트 - by 1-blue
  const onClickLikeButton = useCallback(() => {
    if (!me) return toast.error("로그인 후에 접근이 가능합니다.");
    if (removeLikeLoading || addLikeLoading)
      return toast.error(
        "이미 좋아요 처리중입니다.\n잠시 후에 다시 시도해주세요!"
      );

    if (isMineLiked) {
      removeLike({});

      likerMutate(
        (prev) =>
          prev && {
            ...prev,
            data: {
              likers: prev.data.likers.filter((liker) => liker.idx !== me.idx),
            },
          },
        false
      );
    } else {
      addLike({});

      likerMutate(
        (prev) =>
          prev && {
            ...prev,
            data: {
              likers: [
                ...prev.data.likers,
                {
                  idx: me.idx,
                  name: me.name,
                  avatar: me.avatar || undefined,
                  introduction: me.introduction,
                },
              ],
            },
          },
        false
      );
    }
  }, [
    removeLikeLoading,
    addLikeLoading,
    me,
    isMineLiked,
    removeLike,
    addLike,
    likerMutate,
  ]);

  return (
    <aside className="fixed top-[14%] left-[4%] bg-zinc-200 text-gray-400 py-3 px-2 rounded-full flex flex-col items-center">
      <button
        type="button"
        className={combineClassNames(
          "p-2 border-2 bg-zinc-300 border-gray-400 hover:border-indigo-500 hover:text-indigo-500 rounded-full",
          isMineLiked
            ? "bg-red-200 border-red-300 text-red-400 hover:bg-red-300 hover:border-red-400 hover:text-red-500"
            : ""
        )}
        onClick={onClickLikeButton}
      >
        {isMineLiked ? (
          <Icon
            icon={ICON.HEART}
            $fill
            className="w-6 h-6 animate-heart-beat"
          />
        ) : (
          <Icon icon={ICON.HEART} className="w-6 h-6" />
        )}
      </button>
      <span className="font-semibold text-gray-600">
        {likerResponse?.status.ok ? likerResponse.data.likers.length : 0}
      </span>
    </aside>
  );
};

export default Like;
