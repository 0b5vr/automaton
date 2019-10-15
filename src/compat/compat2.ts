export function compat2( data: any ): any {
  const newData = {
    version: data.v,
    length: data.length,
    resolution: data.resolution,
    params: data.params
  };

  return newData;
}
