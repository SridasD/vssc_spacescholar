const LIA_PORTRAIT_SRC = "/images/LIA-Finalimage.png";

interface LiaPortraitProps {
  /** Extra classes on the outer positioning wrapper — control size/min-height from the caller. */
  className?: string;
}

/**
 * The orbit + organic "blob" portrait treatment used to represent LIA — shared
 * between the home page hero and the chat launch screen so both stay visually
 * identical instead of drifting into two different photo treatments.
 */
export default function LiaPortrait({ className = "" }: LiaPortraitProps) {
  return (
    <div className={`relative grid place-items-center ${className}`}>
      <div className="lia-orbit" aria-hidden />
      <div className="lia-portrait-wrap relative w-full max-w-[320px] aspect-square p-2.5">
        <img
          src={LIA_PORTRAIT_SRC}
          alt="LIA — virtual assistant"
          className="w-full h-full object-cover object-top rounded-[inherit]"
        />
      </div>
    </div>
  );
}
