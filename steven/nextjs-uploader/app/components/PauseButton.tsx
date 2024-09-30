export default function PauseButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    >
      Pause
    </button>
  );
}