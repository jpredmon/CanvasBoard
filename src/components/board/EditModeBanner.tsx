import { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
}

export function EditModeBanner({ visible }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(visible));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  return (
    <div
      className={`overflow-hidden transition-all duration-200 ease-out ${
        show ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-violet-500/20 bg-violet-950/40 px-6 py-1.5">
        <div className="h-1.5 w-1.5 motion-safe:animate-pulse rounded-full bg-violet-400" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide text-violet-400">
          Editing — drag cards to rearrange
        </span>
      </div>
    </div>
  );
}
