# 第二阶段状态图标抠图

模式：内置 image_gen 编辑；transparent_background=true。

## 死火

来源：codex-clipboard-bad09320-126c-45d1-aa8d-a49778a80de5.png

输出：dead-fire.png

Use case: background-extraction. Asset type: pixel game dead-fire status icon. Input image is the edit target. Remove only the beige background to actual alpha transparency. Keep the original purple flame silhouette, square pixel edges and all original purple colors unchanged. Tight framing around the single flame with minimal transparent padding, icon fills the canvas vertically. No glow, shadow, smoothing, added detail, text or checkerboard background. Preserve the original aspect ratio of the flame. Output a transparent PNG cutout.

## 残念

来源：codex-clipboard-cb5c99bf-a91e-43e7-8d08-215ac6f6aafd.png

输出：dragon-remnant.png

Use case: background-extraction. Asset type: pixel game remnant status icon. Input image is the edit target. Extract the exact purple outlined diamond and purple downward arrow onto actual alpha transparency. Remove all beige/white background, including the interior negative space between the diamond frame and the arrow. Keep the original square stair-step pixel edges, silhouette, proportions, and purple shading unchanged. Tight square framing with minimal transparent padding around the diamond. No glow, shadow, smoothing, redesign, extra objects, text or checkerboard. Output a transparent PNG cutout.

