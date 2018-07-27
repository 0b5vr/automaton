const hasOverwrap = ( t1, l1, t2, l2 ) => {
  if ( l2 < l1 ) { return hasOverwrap( t2, l2, t1, l1 ); }
  return (
    t2 < t1 && t1 < t2 + l2 ||
    t2 < t1 + l1 && t1 + l1 < t2 + l2
  );
};

export default hasOverwrap;