export default function FlowingALogo() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full text-gray-900 dark:text-white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 20 80 Q 25 75, 30 65 L 40 40 Q 42 32, 45 25 Q 48 15, 52 10 Q 56 5, 62 8 Q 68 11, 70 20 Q 72 28, 73 35 L 78 55 Q 80 65, 82 72 Q 84 78, 88 80"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 38 50 Q 42 50, 48 50 L 58 50 Q 62 50, 65 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />

      <circle
        cx="88"
        cy="20"
        r="6"
        fill="currentColor"
      />
    </svg>
  );
}
