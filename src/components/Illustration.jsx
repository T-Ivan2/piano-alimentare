import { illustrations } from '../illustrations';

// Fotografie tematiche caricate da Pexels, ritagliate in modo responsivo.
export default function Illustration({ name }) {
  const image = illustrations[name];
  if (!image) return null;
  return (
    <div aria-hidden="true" className="theme-photo -my-1 overflow-hidden rounded-2xl">
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
