import Quill from 'quill';
import {useEffect, useRef, useState} from 'react';

export function DeltaRenderer({delta}: {delta: string}) {
  const [isEmpty, setEmpty] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container !== null) {
      const quill = new Quill(document.createElement('div'), {
        theme: 'snow',
      });
      quill.enable(false);
      const contents = JSON.parse(delta ?? '[]');
      quill.setContents(contents);
      const isEmpty =
        quill
          .getText()
          .replace(/<(.|\n)*?>/g, '')
          .trim().length === 0;
      setEmpty(isEmpty);
      container.innerHTML = quill.root.innerHTML;

      return () => {
        container.innerHTML = '';
      };
    }
  }, [delta]);

  if (isEmpty) return null;

  return <div ref={containerRef} className='ql-editor ql-renderer' />;
}
