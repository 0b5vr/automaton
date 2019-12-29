export function compat2( data: any ): any {
  const newData = {
    version: data.v,
    length: data.length,
    resolution: data.resolution,
    params: data.params,
    guiSettings: {
      snapTimeActive: data.snapActive || false,
      snapTimeInterval: data.snapTime || 0.1,
      snapValueActive: data.snapActive || false,
      snapValueInterval: data.snapValue || 0.1
    }
  };

  return newData;
}
