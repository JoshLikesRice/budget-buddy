interface Props {
  children: string;
}

// One-line, plain-English summary shown beneath each chart.
export function ChartCaption({ children }: Props) {
  return (
    <p className="mt-3 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
