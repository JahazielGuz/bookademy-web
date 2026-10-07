export type FeatureProps = {
  title: string;
  children: React.ReactNode;
};

export default function Feature({ title, children }: FeatureProps) {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}
