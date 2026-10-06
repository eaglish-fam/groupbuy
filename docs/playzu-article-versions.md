# Playzu article versions

The active public article at `/blog/playzu/` uses `vintage`, selected in `config/playzu-article-versions.json`. This version contains only the three mat patterns offered by the October purchase page, while keeping the current Sheet-resolved fail-closed offer behavior.

The complete original article, its exact journal card and shared editorial entry are retained in `config/article-variants/playzu/all-series.json`. The original images have not been removed or overwritten. The archive is source JSON, not a second indexable article; no public toggle reveals unavailable patterns.

To preview a restore without changing the site:

```sh
node scripts/build-playzu-article.mjs --version all-series --output /absolute/path/playzu-original-preview.html
```

After verifying a future campaign's offered patterns and obtaining publication approval, select a version in the config and run:

```sh
node scripts/build-playzu-article.mjs
```

The builder updates only the Playzu article, its single blog index card and its single shared editorial entry. Add future campaign templates as new versions rather than overwriting the original. A restored historical article still needs current metadata, image and offer checks before release. The script does not publish, change the Sheet or send LINE messages.

Vintage photos are authorized vendor media from the current purchase page. Image work uses real pixels, resize and layout only; no generated people or products. A separate vintage cover preserves the original cover assets.
