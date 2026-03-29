export const TrainDirectionIcon = ({
  size = 24,
  color = "currentColor",
  rotation = 0,
}: {
  size?: number;
  color?: string;
  rotation?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 24"
    style={{
      transform: `rotate(${rotation}deg)`,
      display: "block",
    }}
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 6L11 12L5 18" />
  </svg>
);
