import type {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  NextPage,
} from "next";
import { useRouter } from "next/router";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

// type
import {
  Comment,
  ICON,
  Post as PostType,
  SimplePost,
  SimpleUser,
} from "@src/types";

// common-component
import Spinner from "@src/components/common/Spinner";
import Photo from "@src/components/common/Photo";
import Markdown from "@src/components/common/Markdown";
import Post from "@src/components/Post";
import Icon from "@src/components/common/Icon";
import Button from "@src/components/common/Button";
import Modal from "@src/components/common/Modal";

// util
import { dateFormat, timeFormat } from "@src/libs/dateFormat";
import { combineClassNames } from "@src/libs/util";

// hook
import useMe from "@src/hooks/useMe";
import useModal from "@src/hooks/useModal";
import useMutation from "@src/hooks/useMutation";
import useToastMessage from "@src/hooks/useToastMessage";

type PostResponse = {
  ok: boolean;
  post: PostType;
  error?: Error;
};
type CategorizedPostsResponse = {
  ok: boolean;
  category: string;
  posts: SimplePost[];
};
type RelevantPostsResponse = {
  ok: boolean;
  posts: SimplePost[];
};
type CommentForm = {
  comment: string;
};
interface ICommentWithUser extends Comment {
  user: SimpleUser;
}
type CommentsResponse = {
  ok: boolean;
  comments: ICommentWithUser[];
};
type PostRemoveResponse = {
  ok: boolean;
};

const PostDetail: NextPage<PostResponse> = ({ ok, post }) => {
  const router = useRouter();
  const { me } = useMe();

  // 2022/04/30 - 현재 게시글과 같은 카테고리를 가진 게시글들 ( + 동일한 유저 ) - by 1-blue
  const { data: categorizedPosts } = useSWR<CategorizedPostsResponse>(
    router.query.title ? `/api/post/${router.query.title}/categorized` : null
  );
  // 2022/04/30 - 카테고리 토글 변수 - by 1-blue
  const [toggleCategory, setToggleCategory] = useState(false);

  // 2022/04/30 - 현재 게시글과 연관된 게시글들 - by 1-blue
  const { data: relevantPosts } = useSWR<RelevantPostsResponse>(
    router.query.title ? `/api/post/${router.query.title}/relevant` : null
  );

  // 2022/04/30 - 댓글 입력 관련 메서드들 - by 1-blue
  const { handleSubmit, register, reset } = useForm<CommentForm>();
  // 2022/04/30 - comment Ref - by 1-blue
  const { ref, ...rest } = register("comment");
  const commentRef = useRef<HTMLTextAreaElement | null>(null);
  // 2022/04/30 - textarea 자동 높이 조절 - by 1-blue
  const handleResizeHeight = useCallback(() => {
    if (!commentRef.current) return;

    commentRef.current.style.height = "auto";
    commentRef.current.style.height = commentRef.current?.scrollHeight + "px";
  }, [commentRef]);

  // 2022/05/02 - 댓글 추가 패치 가능 여부 - by 1-blue
  const [hasMoreComment, setHasMoreComment] = useState(true);
  // 2022/05/02 - 댓글들 순차적 요청 - by 1-blue
  const {
    data: commentsResponse,
    setSize,
    mutate: commentsMuate,
    isValidating: commentsLoading,
  } = useSWRInfinite<CommentsResponse>(
    router.query.title
      ? (pageIndex, previousPageData) => {
          if (previousPageData && previousPageData.comments.length !== 10) {
            setHasMoreComment(false);
            return null;
          }
          if (previousPageData && !previousPageData.comments.length) {
            setHasMoreComment(false);
            return null;
          }
          return `/api/post/${
            router.query.title
          }/comment?page=${pageIndex}&offset=${10}`;
        }
      : () => null
  );
  // 2022/05/02 - 댓글 추가 관련 메서드 - by 1-blue
  const [addComment, { loading: addCommentLoading }] = useMutation({
    url: router.query.title ? `/api/post/${router.query.title}/comment` : null,
    method: "POST",
  });
  // 2022/05/02 - 댓글 추가 - by 1-blue
  const onAddComment = useCallback(
    (body: CommentForm) => {
      if (body.comment.length === 0)
        return toast.error("댓글을 입력하고 제출해주세요!");
      if (addCommentLoading)
        return toast.error(
          "댓글을 생성하는 중입니다.\n잠시후에 다시 시도해주세요!"
        );

      addComment({ contents: body.comment });

      commentsMuate(
        (prev) =>
          prev && [
            {
              ok: true,
              comments: [
                {
                  idx: Date.now(),
                  contents: body.comment,
                  postIdx: post.id,
                  createdAt: new Date(Date.now()),
                  updatedAt: new Date(Date.now()),
                  user: me!,
                  commentIdx: undefined,
                },
              ],
            },
            ...prev,
          ],
        false
      );

      reset();
    },
    [addCommentLoading, addComment, commentsMuate, post, me, reset]
  );
  // 2022/05/02 - 댓글 삭제 - by 1-blue
  const onRemoveComment = useCallback(
    (commentIdx: number) => async () => {
      await fetch(`/api/post/${router.query.title}/comment/${commentIdx}`, {
        method: "DELETE",
      });

      commentsMuate(
        (prev) =>
          prev &&
          prev.map(({ comments }) => ({
            ok: true,
            comments: comments.filter((comment) => comment.idx !== commentIdx),
          })),
        false
      );
    },
    [router, commentsMuate]
  );

  // 2022/05/01 - 게시글 삭제 모달 - by 1-blue
  const [modalRef, isOpen, setIsOpen] = useModal();
  // 2022/05/01 - 게시글 삭제 요청 관련 메서드 - by 1-blue
  const [removePost, { data: removePostResponse, loading: removePostLoading }] =
    useMutation<PostRemoveResponse>({
      url: router.query.title ? `/api/post/${router.query.title}` : null,
      method: "DELETE",
    });
  // 2022/05/01 - 게시글 삭제 시 성공 토스트 및 페이지 이동 - by 1-blue
  useToastMessage({
    ok: removePostResponse?.ok,
    message: `"${router.query.title}" 게시글을 삭제했습니다.`,
    go: "/",
  });

  if (router.isFallback) return <Spinner kinds="page" />;
  if (!ok) return <span>에러 페이지</span>;

  return (
    <>
      <article className="max-w-[768px] md:w-[60vw] mx-4 md:mx-auto space-y-8 mb-40">
        {/* 제목  */}
        <section>
          <h1 className="text-5xl font-bold">{post.title}</h1>
        </section>

        {/* 작성자, 작성일, 수정, 삭제 */}
        <section className="flex space-x-2">
          <Link href={`/${post.user.name}`}>
            <a className="hover:underline underline-offset-2">
              {post.user.name}
            </a>
          </Link>
          <span>ㆍ</span>
          <span>{dateFormat(post.updatedAt, "YYYY-MM-DD")}</span>
          <div className="flex-1" />
          {me?.id === post.user.id && (
            <>
              <button
                type="button"
                className="text-gray-400 hover:text-black dark:hover:text-white"
                onClick={() =>
                  router.push(`/write?title=${router.query?.title}`)
                }
              >
                수정
              </button>
              <button
                type="button"
                className="text-gray-400 hover:text-black dark:hover:text-white"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                삭제
              </button>
            </>
          )}
        </section>

        {/* 키워드 */}
        <section>
          <ul className="flex flex-wrap space-x-2">
            {post.keywords.map(({ keyword }) => (
              <li
                key={keyword}
                className="bg-zinc-200 text-indigo-600 hover:bg-zinc-300 hover:text-indigo-700 dark:bg-zinc-700 dark:hover:bg-zinc-800 dark:text-indigo-300 dark:hover:text-indigo-400 font-semibold py-2 px-4 mb-2 rounded-md cursor-pointer"
                onClick={() => router.push(`/search?q=${keyword}`)}
              >
                {keyword}
              </li>
            ))}
          </ul>
        </section>

        {/* 같은 카테고리 게시글들 */}
        <section className="bg-zinc-300 dark:bg-zinc-700 px-8 py-6 rounded-md space-y-4">
          <h2 className="text-xl font-semibold">
            {categorizedPosts?.category}
          </h2>
          {toggleCategory && (
            <ul className="space-y-1">
              {categorizedPosts?.posts.map((post, index) => (
                <li key={post.id}>
                  <span className="dark:text-gray-400">{index + 1}. </span>
                  <Link href={`/${post.user.name}/${post.title}`}>
                    <a
                      className={combineClassNames(
                        "font-semibold",
                        router.query.title === post.title
                          ? "text-indigo-400"
                          : ""
                      )}
                    >
                      {post.title}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setToggleCategory((prev) => !prev)}
          >
            {toggleCategory ? "▲ 숨기기" : "▼ 목록 보기"}
          </button>
        </section>

        {/* 섬네일 */}
        <section>
          {post.thumbnail.includes(process.env.NEXT_PUBLIC_IMAGE_BASE_URL!) ? (
            <Photo
              photo={post.thumbnail}
              size="w-full h-80"
              className="m-0"
              $cover
            />
          ) : (
            <figure
              className="w-full h-80 m-0 bg-contain bg-no-repeat bg-center"
              style={{
                backgroundImage: `url("${post.thumbnail}")`,
              }}
            >
              <img src={post.thumbnail} hidden />
            </figure>
          )}
        </section>

        {/* 내용 */}
        <section>
          <Markdown markdown={post.contents} />
        </section>

        <hr />

        {/* 작성자 정보 */}
        <section className="flex items-center space-x-4">
          <Photo
            photo={post.user.avatar}
            size="w-20 h-20"
            alt="유저 이미지"
            $rouneded
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold">{post.user.name}</span>
            <span>{post.user.introduction}</span>
          </div>
        </section>

        <hr />

        {/* 댓글 작성 */}
        <section className="space-y-4">
          <span className="font-semibold">{"n"}개의 댓글</span>
          <form className="space-y-4" onSubmit={handleSubmit(onAddComment)}>
            <textarea
              placeholder="댓글을 작성하세요"
              {...rest}
              className="w-full p-4 focus:outline-none resize-none rounded-sm bg-zinc-200 dark:bg-zinc-600"
              onInput={handleResizeHeight}
              ref={(e) => {
                ref(e);
                commentRef.current = e;
              }}
            />
            <Button
              type="submit"
              className="block ml-auto font-semibold bg-indigo-400 text-white dark:bg-indigo-500 py-2 px-4 rounded-md"
              contents="댓글 작성"
              loading={addCommentLoading}
            />
          </form>
        </section>

        {/* 댓글들 */}
        <section>
          <>
            {commentsResponse?.map(({ comments }, index) => (
              <ul key={index} className="divide-y dark:divide-gray-400">
                {comments.map((comment) => (
                  <li key={comment.idx} className="space-y-4 pt-4">
                    {/* 아바타, 이름, 작성시간, 삭제 버튼 */}
                    <div className="flex space-x-2">
                      <Photo
                        photo={comment.user.avatar}
                        size="w-14 h-14"
                        alt="유저 이미지"
                        $rouneded
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {comment.user.name}
                        </span>
                        <time className="text-sm dark:text-gray-400">
                          {timeFormat(comment.updatedAt)}
                        </time>
                      </div>
                      <div className="flex-1" />
                      {comment.user.id === me?.id && (
                        <button
                          type="button"
                          className="self-start text-gray-400 hover:text-white"
                          onClick={onRemoveComment(comment.idx)}
                        >
                          삭제
                        </button>
                      )}
                    </div>

                    {/* 내용 */}
                    <p className="whitespace-pre-line">{comment.contents}</p>

                    {/* 답글 */}
                    <div></div>
                  </li>
                ))}
              </ul>
            ))}

            {hasMoreComment ? (
              <Button
                type="button"
                className="block mx-auto px-4 py-2 rounded-md font-semibold text-white bg-indigo-400 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                contents="댓글 더 불러오기"
                onClick={() => setSize((prev) => prev + 1)}
                loading={commentsLoading}
              />
            ) : (
              <span className="block text-center text-xl font-semibold">
                더 이상 불러올 댓글이 없습니다.
              </span>
            )}
          </>
        </section>
      </article>

      <hr />

      {/* 연관 게시글들 */}
      <section>
        <span className="block text-center mb-8 text-2xl">
          관심 있을만한 게시글
        </span>
        <ul className="grid gird-col-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {relevantPosts?.posts.map((post) => (
            <Post key={post.id} post={post} photoSize="w-full h-[200px]" />
          ))}
        </ul>
      </section>

      {/* 좌측 좋아요 */}
      <aside className="fixed top-[10%] left-[4%] bg-zinc-200 text-gray-400 py-3 px-2 rounded-full flex flex-col items-center">
        <button
          type="button"
          className="p-2 border-2 bg-zinc-300 border-gray-400 hover:border-indigo-500 hover:text-indigo-500 rounded-full"
        >
          <Icon icon={ICON.HEART} />
        </button>
        <span className="font-semibold text-gray-600">{"n"}</span>
      </aside>

      {/* 우측 네비게이션 */}
      <aside></aside>

      {/* 게시글 삭제 모달 */}
      {isOpen && (
        <Modal ref={modalRef} noScroll primary>
          <form className="flex flex-col bg-zinc-900 p-8 rounded-md space-y-4 w-[400px]">
            <span className="font-bold text-2xl">포스트 삭제</span>
            <span>정말 포스트를 삭제하시겠습니까?</span>
            <div />
            <div className="text-right space-x-2">
              <button
                type="button"
                className="px-6 py-2 bg-indigo-400 rounded-md hover:bg-indigo-500"
              >
                취소
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-indigo-400 rounded-md hover:bg-indigo-500"
                onClick={() => removePost({})}
              >
                확인
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 게시글 삭제 스피너 */}
      {removePostLoading && <Spinner kinds="page" />}
    </>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
  try {
    const post = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/post/${context.params?.title}`
    ).then((res) => res.json());

    return {
      props: {
        ...JSON.parse(JSON.stringify(post)),
      },
    };
  } catch (error) {
    console.error(error);

    return {
      props: {
        ok: false,
        post: {},
        error,
      },
    };
  }
};

export default PostDetail;
