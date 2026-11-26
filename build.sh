#!/bin/sh
set -e
cd "$(dirname "$0")"
OUT=${1:-index.html}
cat src/00_head.html > "$OUT"
for f in src/10_core.js src/20_models.js src/25_data.js src/26_api.js src/27_weapons.js src/30_world.js src/31_post.js src/40_player.js src/41_combat.js src/42_mobs.js src/43_gather.js src/50_ui.js src/55_touch.js src/56_daily.js src/60_net.js src/90_main.js; do
  cat "$f" >> "$OUT"; printf '\n' >> "$OUT"
done
printf '</script>\n</body>\n</html>\n' >> "$OUT"
# syntax check of the inline script
python3 - "$OUT" <<'PY'
import sys,re
s=open(sys.argv[1]).read()
m=re.search(r'<script>\n(.*)</script>\n</body>',s,re.S)
open('/tmp/_all2.js','w').write(m.group(1))
PY
node --check /tmp/_all2.js && echo "syntax ok" && ls -la "$OUT"
