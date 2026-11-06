#!/bin/sh
# собирает страницу для проверки так же, как её оборачивает артефакт: head-обёртка + body.html
cd /home/claude/rechka
mkdir -p test
{ cat src/wrapper_head.html; printf '\n'; cat src/body.html; printf '\n</body></html>\n'; } > test/index.html
for f in src/data*.js src/sounds*.js; do ln -sf ../$f test/$(basename $f); done
for d in anim anim2 img7 img8 img13 img24; do [ -d src/$d ] && ln -sfn ../src/$d test/$d; done
true
