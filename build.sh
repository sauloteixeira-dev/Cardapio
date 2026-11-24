#!/bin/sh
# Gera a versão minificada do site em dist/ (usada pelo Netlify no deploy).
# Rodar local: sh build.sh   → abre dist/index.html
set -e
mkdir -p dist
npx --yes html-minifier-terser@7.2.0 \
  --collapse-whitespace --conservative-collapse \
  --remove-comments --remove-redundant-attributes \
  --minify-css true \
  --minify-js '{"compress":{"passes":2},"mangle":{"toplevel":true},"format":{"comments":false}}' \
  -o dist/index.html index.html
echo "OK: dist/index.html ($(wc -c < dist/index.html) bytes, original $(wc -c < index.html) bytes)"
