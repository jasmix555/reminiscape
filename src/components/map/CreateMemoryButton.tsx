import { HiPlus } from "react-icons/hi";

const CreateMemoryButton = ({ onClick }: { onClick: () => void }) => (
  <button
    className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 transform items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-black shadow-glass-lg transition-all duration-200 hover:bg-accent-soft hover:scale-[1.03] active:scale-95"
    onClick={onClick}
  >
    <HiPlus className="w-5 h-5" /> Create Memory
  </button>
);

export default CreateMemoryButton;
