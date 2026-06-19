import { HiPlus } from "react-icons/hi";

const CreateMemoryButton = ({
  onClick,
  hidden,
}: {
  onClick: () => void;
  hidden?: boolean;
}) => (
  <button
    className={`absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 transform items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-black shadow-glass-lg transition-all duration-300 hover:bg-accent-soft active:scale-95 ${
      hidden
        ? "pointer-events-none translate-y-28 opacity-0"
        : "opacity-100 hover:scale-[1.03]"
    }`}
    onClick={onClick}
  >
    <HiPlus className="w-5 h-5" /> Create Memory
  </button>
);

export default CreateMemoryButton;
