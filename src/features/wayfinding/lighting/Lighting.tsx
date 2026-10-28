/**
 * Lighting — 极简灯光配置
 * 不使用 HDRI / environment map / 强阴影
 * 目标：保留「平面插画」质感
 *
 * 因为 Sign 表面使用 MeshBasicMaterial（无光照），
 * 这里只需要极少的环境光来提示支柱的立体感
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.9} />
      {/* 一束极弱的方向光，只让支柱的黑色不至于死黑 */}
      <directionalLight
        position={[3, 5, 4]}
        intensity={0.2}
        castShadow={false}
      />
    </>
  );
}
