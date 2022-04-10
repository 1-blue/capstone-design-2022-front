import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

// commom-component
import Icon from "@src/components/common/Icon";
import Photo from "@src/components/common/Photo";
import Modal from "@src/components/common/Modal";

// type
import { ICON } from "@src/types";

// hook
import useUser from "@src/hooks/useUser";

const Header = () => {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const modalRef = useRef<null | HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // 2022/04/10 - 영역외 클릭 시 모달 닫기 이벤트 - by 1-blue
  const handleCloseModal = useCallback(() => {
    if (isOpen) setIsOpen(false);
  }, [isOpen]);

  // 2022/04/10 - 모달 닫기 이벤트 등록 - by 1-blue
  useEffect(() => {
    setTimeout(() => window.addEventListener("click", handleCloseModal), 0);
    return () => window.removeEventListener("click", handleCloseModal);
  }, [handleCloseModal]);

  return (
    <header className="lg:max-w-[1024px] xl:max-w-[1200px] 2xl:max-w-[1536px] w-full mx-auto flex justify-between items-center dark:text-white pt-4 mb-12 px-4">
      {/* 로그 */}
      <h1 className="py-4 font-bold">
        <Link href="/">
          <a>JSLog</a>
        </Link>
      </h1>

      {/* 네비게이션 */}
      <nav className="space-x-4 flex">
        {/* theme */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-10 h-10 rounded-full hover:bg-slate-200 inline-flex justify-center items-center dark:hover:text-black"
        >
          <Icon
            icon={theme === "dark" ? ICON.SUN : ICON.MOON}
            $fill
            className="w-7 h-7"
          />
        </button>
        {/* search */}
        <Link href="/search">
          <a className="w-10 h-10 rounded-full hover:bg-slate-200 inline-flex justify-center items-center dark:hover:text-black">
            <Icon icon={ICON.SEARCH} />
          </a>
        </Link>
        {/* ( 게시글 작성 and 모달창 ) or 로그인 */}
        {user ? (
          <>
            <Link href="/write">
              <a className="h-10 rounded-r-full rounded-l-full px-4 border-2 border-black dark:border-white  hover:bg-black dark:hover:bg-slate-200 hover:text-white dark:hover:text-black leading-10">
                새 글 작성
              </a>
            </Link>
            <button
              type="button"
              className="flex items-center space-x-1 relative"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <Photo
                photo={user.avatar}
                size="w-10 h-10"
                alt="유저 프로필 이미지"
                $rouneded
              />
              <Icon
                icon={ICON.CHEVRON_DOWN}
                className="w-4 h-4 text-gray-400"
              />
              {isOpen && (
                <Modal
                  className="top-14 right-2 flex flex-col w-52 rounded-md list-none"
                  ref={modalRef}
                >
                  <>
                    <Link href={`/${user.name}`}>
                      <a className="px-4 py-3 w-full text-left">내 정보</a>
                    </Link>

                    <Link href="/saves">
                      <a className="px-4 py-3 w-full text-left">임시 글</a>
                    </Link>

                    <Link href="/list/liked">
                      <a className="px-4 py-3 w-full text-left">읽기 목록</a>
                    </Link>

                    <Link href="/setting">
                      <a className="px-4 py-3 w-full text-left">설정</a>
                    </Link>
                    <button
                      type="button"
                      className="px-4 py-3 w-full text-left"
                    >
                      로그아웃
                    </button>
                  </>
                </Modal>
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="h-10 rounded-r-full rounded-l-full px-4 hover:bg-slate-200 dark:hover:text-black"
          >
            <span>로그인</span>
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;