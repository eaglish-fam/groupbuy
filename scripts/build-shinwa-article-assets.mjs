#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const sourceRoot = process.env.SHINWA_SOURCE_ROOT;
const alignedFrameRoot = process.env.SHINWA_ALIGNED_FRAME_ROOT;
if (!sourceRoot || !alignedFrameRoot) throw new Error('Set SHINWA_SOURCE_ROOT and SHINWA_ALIGNED_FRAME_ROOT to the reviewed private source roots');
const outputRoot = resolve(root, 'assets/shinwa-living');
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');

const sources = {
  blocks: [`${sourceRoot}/luca/photos/selected/blocks-forest.webp`, 'ea645a5892d077744c936f3862eab584657dd9e707c64937caabfd6a92bce61f'],
  chair: [`${sourceRoot}/luca/photos/selected/cypress-child-table-chairs.webp`, '0b6771a56fd2567633e66f1813f84189c7a332986f52883dbad0153ffdf6d444'],
  table: [`${sourceRoot}/luca/photos/selected/fold-table-mahjong.webp`, '13d9e30a4ba72985cd75f63ef539bd3df468c083a2c55750c286fd8cf7fd9820'],
  tableDetail: [`${sourceRoot}/luca/photos/selected/fold-table-detail.webp`, '082258e99525b2aa890b8f12f0fc6fc993c347824489b9dcefade47876b8e099'],
  memory: [`${sourceRoot}/luca/photos/selected/memory-box-dog.webp`, '0f6badb56e8ab219531b00d51e41766954bb382c62f24b91db45f671c960ba85'],
  scratcherOriginal: [`${sourceRoot}/luca/photos/originals/1u94PhnOOkrXsI2L3wb6embyRYq-1nEzU.png`, 'a58775a9a87db4384f4e139514c0853326c6b531dbe3042bc5e13edb6e7be828'],
  shoeWhole: [`${sourceRoot}/luca/photos/selected/cat-shoehorn-whole.webp`, '2d944c7a2ee331c263e797696983e427fb346376c2585ce7c586ab58cf0e80da'],
  shoeDetail: [`${sourceRoot}/luca/photos/selected/cat-shoehorn-detail.webp`, '6f848866632efd2a97cc0a1b480f0923faa7c12a12116aa196a2c70c3e4279ba'],
  shoeUse: [`${sourceRoot}/luca/photos/selected/cat-shoehorn-use.webp`, 'c91c7faa90cff3bd54f762e60c4329e57735360c4c6837e5d853dbf55cb6e55a'],
  videoWoodwork: [`${sourceRoot}/luca/video-frames/selected/uIOk9Ie0YN0-0610.jpg`, '4f29e3db2c33826e482e8aaa2670968998345f7198ee76ee77cc961ad06b0708'],
  videoBlocks: [`${sourceRoot}/luca/video-frames/selected/uIOk9Ie0YN0-0256.jpg`, '5c5d21bbbf7b7b4586438ef60a2f70bd413d53de55da303c66a403c161ef94bb'],
  videoBed: [`${sourceRoot}/luca/video-frames/selected/5mPDjzQOuPA-0076.jpg`, 'c641f99ea68389ad1e9dd7def2e28dc788406928c5f0269c2ef12c8a5c7eb86e'],
  videoVisit: [`${alignedFrameRoot}/dSgptEdzEqM-0865.jpg`, 'b734201ba6e9ceb1ea5e996840ae201eaae5dfebfb2237d9363ac14782f823ef'],
  videoMarket: [`${alignedFrameRoot}/z07oMlyI7ew-0028.jpg`, '576ca6b41cbd4f3fd61851f250dda7fd6bd75369cf9b042291aa1a24d54daf6c'],
  videoOuting: [`${sourceRoot}/luca/video-frames/selected/XpqY8O9-x40-1677.jpg`, 'e9a905df14dc6dc254843f9c27e33b4875a8e5ab3e6e6061a2b6e209ee9a1a33'],
};
const publicSourceUrls = {
  blocks: 'https://drive.google.com/file/d/17qT7ghziUKeyRbEUEt73HxyT08c-d17b/view?usp=drivesdk',
  chair: 'https://www.shinwaliving.com/products/7b70ba30-1347-4582-8fdd-f9518dde2ed9',
  table: 'https://drive.google.com/file/d/1GNqgcaDQMFZWmJDKevo9D-Ezzgj-BMDA/view?usp=drivesdk',
  tableDetail: 'https://drive.google.com/file/d/1kZkNXIZFL1_YVof9EKG1enwr7e35wQqc/view?usp=drivesdk',
  memory: 'https://drive.google.com/file/d/1w7QNmVO4YCbLTorUkYensCh4jQuH-73H/view?usp=drivesdk',
  scratcherOriginal: 'https://drive.google.com/file/d/1u94PhnOOkrXsI2L3wb6embyRYq-1nEzU/view?usp=drivesdk',
  shoeWhole: 'https://drive.google.com/file/d/1kEVWHEVfnbF1acQ4qdQpiOyincUpXdEa/view?usp=drivesdk',
  shoeDetail: 'https://drive.google.com/file/d/1gJf_eW9sTElEcekOLOxloasXVa8aK9Vv/view?usp=drivesdk',
  shoeUse: 'https://drive.google.com/file/d/1ZpITlCpdnHkVXJ94zUztVrCIOBW8geTJ/view?usp=drivesdk',
  videoWoodwork: 'https://www.youtube.com/watch?v=uIOk9Ie0YN0&t=529s',
  videoBlocks: 'https://www.youtube.com/watch?v=uIOk9Ie0YN0&t=136s',
  videoBed: 'https://www.youtube.com/watch?v=5mPDjzQOuPA&t=71s',
  videoVisit: 'https://www.youtube.com/watch?v=dSgptEdzEqM&t=832s',
  videoMarket: 'https://www.youtube.com/watch?v=z07oMlyI7ew&t=0s',
  videoOuting: 'https://www.youtube.com/watch?v=XpqY8O9-x40&t=851s',
};

for (const [id, [path, expected]] of Object.entries(sources)) {
  if (sha(path) !== expected) throw new Error(`Frozen source changed: ${id}`);
}

mkdirSync(outputRoot, { recursive: true });
const copied = {
  blocks: 'blocks-forest.webp', chair: 'cypress-child-table-chairs.webp', table: 'fold-table-mahjong.webp',
  tableDetail: 'fold-table-detail.webp', memory: 'memory-box-dog.webp', shoeWhole: 'cat-shoehorn-whole.webp',
  shoeDetail: 'cat-shoehorn-detail.webp', shoeUse: 'cat-shoehorn-use.webp',
};
for (const [id, name] of Object.entries(copied)) copyFileSync(sources[id][0], resolve(outputRoot, name));

await sharp(sources.scratcherOriginal[0]).rotate().webp({ quality: 88, effort: 5 }).toFile(resolve(outputRoot, 'cat-scratcher.webp'));

const videoNames = {
  videoWoodwork: 'video-woodwork.webp', videoBlocks: 'video-blocks.webp', videoBed: 'video-bed.webp',
  videoVisit: 'video-visit.webp', videoMarket: 'video-market.webp', videoOuting: 'video-outing.webp',
};
for (const [id, name] of Object.entries(videoNames)) {
  await sharp(sources[id][0]).rotate().webp({ quality: 86, effort: 5 }).toFile(resolve(outputRoot, name));
}

const coverSvg = (width, panelTop, titleSize, subSize) => Buffer.from(`<svg width="${width}" height="${Math.round(width * .625)}" xmlns="http://www.w3.org/2000/svg"><rect y="${panelTop}" width="${width}" height="${Math.round(width * .625) - panelTop}" fill="#eee5d4"/><rect x="${Math.round(width * .055)}" y="${panelTop + 25}" width="${Math.max(5, Math.round(width * .006))}" height="52" rx="2" fill="#8a5f3d"/><text x="${Math.round(width * .08)}" y="${panelTop + 66}" fill="#274c3f" font-family="Songti TC, Noto Serif CJK TC, serif" font-size="${titleSize}" font-weight="600">心窪生活</text><text x="${Math.round(width * .34)}" y="${panelTop + 62}" fill="#5e604f" font-family="PingFang TC, sans-serif" font-size="${subSize}">積木・兒童桌椅・木製禮物</text></svg>`);
const baseCover = await sharp(sources.blocks[0]).resize({ width: 1600, withoutEnlargement: true }).toBuffer();
await sharp({ create: { width: 1600, height: 1000, channels: 3, background: '#eee5d4' } })
  .composite([{ input: baseCover, top: 0, left: 0 }, { input: coverSvg(1600, 900, 54, 25), top: 0, left: 0 }])
  .webp({ quality: 90, effort: 6 }).toFile(resolve(outputRoot, 'cover.webp'));
for (const width of [480, 960]) {
  await sharp(resolve(outputRoot, 'cover.webp')).resize(width, Math.round(width * .625)).webp({ quality: 86, effort: 5 }).toFile(resolve(outputRoot, `cover-${width}.webp`));
}

const cardPhoto = await sharp(sources.blocks[0]).resize({ width: 1000, withoutEnlargement: true }).toBuffer();
const cardSvg = Buffer.from('<svg width="1000" height="750" xmlns="http://www.w3.org/2000/svg"><rect y="563" width="1000" height="187" fill="#eee5d4"/><rect x="58" y="606" width="7" height="77" rx="2" fill="#8a5f3d"/><text x="86" y="641" fill="#274c3f" font-family="Songti TC, Noto Serif CJK TC, serif" font-size="42" font-weight="600">心窪生活</text><text x="86" y="686" fill="#5e604f" font-family="PingFang TC, sans-serif" font-size="23">積木・兒童桌椅・木製禮物</text></svg>');
await sharp({ create: { width: 1000, height: 750, channels: 3, background: '#eee5d4' } })
  .composite([{ input: cardPhoto, top: 0, left: 0 }, { input: cardSvg, top: 0, left: 0 }])
  .webp({ quality: 90, effort: 6 }).toFile(resolve(outputRoot, 'product-card.webp'));
for (const width of [480, 960]) {
  await sharp(resolve(outputRoot, 'product-card.webp')).resize(width, Math.round(width * .75)).webp({ quality: 86, effort: 5 }).toFile(resolve(outputRoot, `product-card-${width}.webp`));
}

const assetNames = [...Object.values(copied), 'cat-scratcher.webp', ...Object.values(videoNames), 'cover.webp', 'cover-480.webp', 'cover-960.webp', 'product-card.webp', 'product-card-480.webp', 'product-card-960.webp'];
const outputs = [];
for (const name of assetNames) {
  const path = resolve(outputRoot, name);
  const metadata = await sharp(path).metadata();
  outputs.push({ path: `/assets/shinwa-living/${name}`, sha256: sha(path), width: metadata.width, height: metadata.height });
}
const manifest = {
  schema: 'eaglish.shinwa-media/v1',
  generatedAt: new Date().toISOString(),
  sourcePolicy: 'Root-adopted genuine photographs and first-party video frames only; no generated product pixels.',
  sources: Object.fromEntries(Object.entries(sources).map(([id, [, sourceSha256]]) => [id, { sourceId: id, sourceUrl: publicSourceUrls[id], sha256: sourceSha256 }])),
  transforms: {
    cover: 'blocks-forest proportional width downscale to 1600x900 plus a 100px editorial title band; full source composition retained',
    card: 'blocks-forest proportional width downscale to 1000x563 plus a 187px editorial identity band; full source composition retained',
    catScratcher: 'original 1100x1767 PNG converted to WebP at original dimensions; no enlargement, crop, padding or generative edit',
    bodyPhotos: 'byte-identical adopted WebP copies except cat-scratcher as recorded above',
    videoPosters: 'approved first-party frames converted to WebP without crop or generative edit',
  },
  outputs,
};
writeFileSync(resolve(outputRoot, 'media-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Built ${outputs.length} Shinwa article assets`);
