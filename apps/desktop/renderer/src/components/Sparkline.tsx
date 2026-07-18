export function Sparkline(props: { data: Array<'ok' | 'fail'> }): JSX.Element {
  return (
    <span className="inline-flex items-end gap-[2px]" style={{ height: 16 }}>
      {props.data.map((datum, i) => (
        <i
          key={i}
          className={`block w-[3px] rounded-sm not-italic ${
            datum === 'fail' ? 'bg-signal' : 'bg-muted'
          }`}
          style={{ height: '100%' }}
        />
      ))}
    </span>
  );
}
