export function Waveform(props: { level?: number; bars?: number }): JSX.Element {
  const bars = props.bars ?? 5;
  const level = props.level ?? 1;

  return (
    <span className="inline-flex items-end gap-[2px]" style={{ height: 15 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <i
          key={i}
          className="block w-[2px] rounded-sm bg-body not-italic"
          style={{
            animation: 'wave 1.1s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
            animationPlayState: level > 0 ? 'running' : 'paused',
          }}
        />
      ))}
    </span>
  );
}
