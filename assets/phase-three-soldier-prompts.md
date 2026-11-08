# 三阶段死士素材

模式：内置 image_gen 编辑，透明背景。

按用户指定，第一张橙焰战士为死士（苍），位于巨龙右侧；第二张蓝焰弓手为死士（赫），位于巨龙左侧。

## death-soldier-cang.png

Use case: background-extraction. Edit target: attached orange-flame skeletal warrior holding a flaming spear and shield. For a pixel game sprite, remove the black background to actual alpha transparency and remove the white AI生成+ text at top left. Preserve the entire original warrior, weapon, all orange flames, pose, colors, square pixel style and dark outlines. Do not erase dark parts inside the warrior. Also remove tiny stray watermark artifacts on the armor, restoring matching pixel armor details without changing the character. Tight full-body framing with a little transparent padding; no added glow, shadow, text or background. Transparent PNG cutout.

## death-soldier-he.png

Use case: background-extraction. Edit target: attached blue-flame skeletal archer carrying a bow and quiver. Create a transparent pixel game sprite: remove only the black background to actual alpha transparency and remove the white AI生成+ watermark at top left. Also clean tiny stray watermark artifacts on the armor while preserving its pixel texture. Keep the full archer, blue flames, bow, arrow, dark cloak, silhouette, pose and original colors unchanged. Preserve black/dark interior character pixels, do not erase them. Tight full-body framing with a little transparent padding. No new glow, shadow, text, objects or background. Output transparent PNG.

