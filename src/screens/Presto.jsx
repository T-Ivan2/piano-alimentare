export default function Presto({ theme, title, text }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[30px] font-semibold m-0">{title}</h1>
      <p className="rounded-[22px] p-4 m-0 text-[15px]" style={{ background: theme.surf, color: '#C9BBA8' }}>{text}</p>
    </div>
  );
}
