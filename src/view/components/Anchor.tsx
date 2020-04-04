import React from 'react';

// == element ======================================================================================
export interface AnchorProps {
  className?: string;
  href: string;
  children: React.ReactNode;
}

const Anchor = ( { className, href, children }: AnchorProps ): JSX.Element => (
  <a className={ className } rel="noopener noreferrer" target="_blank" href={ href }>
    { children }
  </a>
);

export { Anchor };
