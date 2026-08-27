/**
 * react-three-fiber's JSX elements.
 *
 * r3f renders `<mesh>`, `<boxGeometry>`, `<ambientLight>` and friends as
 * intrinsic JSX elements. On v9 + React 19 that augmentation is no longer
 * applied automatically — the library ships `ThreeElements` and expects the
 * app to register it, so that a project that never touches 3D does not carry
 * a few hundred extra intrinsic elements in its type space.
 *
 * We require the library lazily (src/ui/hero-3d.tsx) so a missing native
 * module cannot crash the login screen, which means TypeScript never sees an
 * import to hang the augmentation off. This file is that import.
 */

import type { ThreeElements } from '@react-three/fiber';

declare global {
   
  namespace React {
     
    namespace JSX {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}
