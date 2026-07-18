export function RecordingDot(props: { size?: number }): JSX.Element {
  const size = props.size ?? 6;
  return (
    <span
      className="inline-block rounded-full bg-signal"
      style={{ width: size, height: size, animation: 'breathe 3s ease-in-out infinite' }}
    />
  );
}
