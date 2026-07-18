import { Mermaid } from '../../../components/Mermaid';

export function SpecFlow(props: { chart: string; summary?: string }): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      {props.summary ? <p className="text-sm text-body">{props.summary}</p> : null}
      <Mermaid chart={props.chart} />
    </div>
  );
}
