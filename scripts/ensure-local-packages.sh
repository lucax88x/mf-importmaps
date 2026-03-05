#!/bin/sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_PACKAGES_DIR="$ROOT_DIR/example/.local-packages"

missing=0

for pkg_json in "$ROOT_DIR"/example/packages/*/package.json; do
  # Extract file: dependencies pointing to .local-packages tarballs
  tarballs=$(grep -oE 'file:\.\./\.\./\.local-packages/[^"]+' "$pkg_json" 2>/dev/null || true)
  for ref in $tarballs; do
    filename=$(echo "$ref" | sed 's|file:../../.local-packages/||')
    tarball_path="$LOCAL_PACKAGES_DIR/$filename"

    if [ ! -f "$tarball_path" ]; then
      # Parse "mf-example-ui-0.0.5.tgz" -> scope=@mf, name=example-ui, version=0.0.5
      base=$(echo "$filename" | sed 's/\.tgz$//')
      version=$(echo "$base" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$')
      raw_name=$(echo "$base" | sed "s/-${version}$//")
      scope=$(echo "$raw_name" | cut -d'-' -f1)
      rest=$(echo "$raw_name" | cut -d'-' -f2-)
      scoped_name="@${scope}/${rest}"

      echo "Creating placeholder tarball for ${scoped_name}@${version}..."

      mkdir -p "$LOCAL_PACKAGES_DIR"
      tmp_dir="$LOCAL_PACKAGES_DIR/.tmp-${raw_name}"
      mkdir -p "$tmp_dir/package"
      printf '{"name":"%s","version":"%s"}' "$scoped_name" "$version" > "$tmp_dir/package/package.json"
      tar czf "$tarball_path" -C "$tmp_dir" package
      rm -rf "$tmp_dir"

      echo "Created $filename"
      missing=1
    fi
  done
done

if [ "$missing" -eq 0 ]; then
  echo "All local package tarballs exist."
fi
