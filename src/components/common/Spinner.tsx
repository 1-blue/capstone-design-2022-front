import React, { useCallback } from "react";

type sinnerType = "button" | "page";

type Props = {
  kinds: sinnerType;
};

const Spinner = ({ kinds }: Props) => {
  const getSpinner = useCallback((kinds: sinnerType) => {
    switch (kinds) {
      case "button":
        return (
          <div className="w-6 h-6 mx-auto text-xs border-[5px] border-solid border-white/40 border-t-white rounded-full animate-spin bg-transparent" />
        );
      case "page":
        return (
          <aside className="fixed bg-black/60 top-0 left-0 w-full h-full z-20 flex justify-center items-center animate-fade-in">
            <svg
              version="1.1"
              id="layer"
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              viewBox="0 0 40 40"
              xmlSpace="preserve"
              fill="#8A39E1"
              width="200px"
              height="200px"
              className="animate-spin-y mx-auto"
            >
              <g>
                <path d="M14.8,5.1L8.8,33C5.8,29.9,4,25.5,4,21C4,13.6,8.5,7.3,14.8,5.1 M20,0C9,0,0,9.4,0,21c0,8.4,4.7,15.5,11.4,19L20,0L20,0z" />
                <path d="M25.2,5.1C31.5,7.3,36,13.6,36,21c0,4.5-1.8,8.9-4.8,12L25.2,5.1 M20,0l8.6,40C35.3,36.5,40,29.4,40,21C40,9.4,31,0,20,0L20,0z" />
              </g>
            </svg>
          </aside>
        );

      default:
        return (
          <div className="w-6 h-6 mx-auto text-xs border-[5px] border-solid border-white/40 border-t-white rounded-full animate-spin bg-transparent" />
        );
    }
  }, []);

  return <>{getSpinner(kinds)}</>;
};

export default Spinner;
