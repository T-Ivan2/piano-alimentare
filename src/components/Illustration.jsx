import { illustrations } from '../illustrations';

// SVG statici scritti da noi: sicuri da inserire come markup
export default function Illustration({ name }) {
  const svg = illustrations[name];
  if (!svg) return null;
  return <div aria-hidden="true" className="theme-illustration -my-1" dangerouslySetInnerHTML={{ __html: svg }} />;
}
