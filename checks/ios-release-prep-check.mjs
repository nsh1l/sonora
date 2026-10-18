import {strict as assert} from 'node:assert';

const read = path => Bun.file(new URL(`../${path}`, import.meta.url)).text();
const [app, host, bridge, html, project, info, privacy, workflow, build, server, worker, support, policy] = await Promise.all([
  'ios/SONORA/SONORAApp.swift','ios/SONORA/RendererHost.swift','native-bridge.js','index.html',
  'ios/SONORA.xcodeproj/project.pbxproj','ios/SONORA/Info.plist','ios/SONORA/PrivacyInfo.xcprivacy',
  '.github/workflows/ios-release-prep.yml','build.mjs','server.mjs','sw.js','support.html','privacy.html'
].map(read));

assert.match(app, /Text\("Local File"\)\.tag\(RendererMode\.local\)/);
assert.match(app, /if spotify\.isConfigured/);
assert.match(html, /\.sonora-shell\.sonora-local \.transport/);
assert.match(html, /\.sonora-shell\.sonora-local \.tools/);
assert.match(html, /\.sonora-shell\.sonora-local \.tools input\[type=file\]\{position:absolute;inset:0;width:100%;height:44px/);
assert.match(html, /for="audioFile"/);
assert.match(html, /id="play"[\s\S]*id="seek"/);
assert.match(html, /window\.SONORA\.releaseLocal=\(\)=>\{audio\.pause\(\);audio\.removeAttribute\('src'\);audio\.load\(\);if\(objectURL\)\{URL\.revokeObjectURL\(objectURL\)/);
assert.match(bridge, /latest\.mode === 'local' && next\?\.mode !== 'local'\) global\.SONORA\.releaseLocal/);
assert.match(host, /generation \+= 1\s+audio\.stop\(\)[\s\S]*mode = next[\s\S]*case \.local: send/);
assert.match(host, /case \.idle, \.local, \.spotify: return/);
assert.match(host, /if mode == \.local \{ web\.evaluateJavaScript\("window\.SONORA\.pauseLocal/);

assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = party\.alwaysyesterday\.sonora/g);
assert(!project.includes('CODE_SIGN_ENTITLEMENTS'));
assert(!await Bun.file(new URL('../ios/SONORA/SONORA.entitlements', import.meta.url)).exists());
assert.match(info, /<key>CFBundleShortVersionString<\/key><string>1\.0<\/string>/);
assert.match(info, /<key>CFBundleVersion<\/key><string>1<\/string>/);
assert.match(project, /ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon/g);
for (const [file, ref] of [['Assets.xcassets','01A0B0C0D0E0F00102030423'],['PrivacyInfo.xcprivacy','01A0B0C0D0E0F00102030424']]) {
  assert(project.includes(`path = ${file};`));
  assert(project.match(/PBXResourcesBuildPhase; files = \(([^)]*)\)/)?.[1].includes(ref), `${file} missing from resource phase`);
}
const icon = new Uint8Array(await Bun.file(new URL('../ios/SONORA/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png',import.meta.url)).arrayBuffer());
const view = new DataView(icon.buffer,icon.byteOffset,icon.byteLength);
assert.equal(view.getUint32(16),1024);assert.equal(view.getUint32(20),1024);
assert.equal(icon[25],2,'app icon must be opaque RGB PNG');
const catalog = JSON.parse(await read('ios/SONORA/Assets.xcassets/AppIcon.appiconset/Contents.json'));
assert.equal(catalog.images[0].filename,'AppIcon-1024.png');
assert.match(privacy, /<key>NSPrivacyTracking<\/key><false\/>/);
for(const key of ['NSPrivacyTrackingDomains','NSPrivacyCollectedDataTypes','NSPrivacyAccessedAPITypes'])assert(privacy.includes(`<key>${key}</key><array/>`));
assert(!privacy.includes('true/'));

for(const page of ['privacy.html','support.html']) {
  assert(build.includes(`'${page}'`) && server.includes(`'${page}'`) && worker.includes(`'/${page}'`));
  assert(html.includes(`href="/${page}"`));
}
assert.match(support, /https:\/\/github\.com\/nsh1l\/sonora\/issues/);
assert.match(policy, /https:\/\/github\.com\/nsh1l\/sonora\/issues/);
assert.match(worker, /const CACHE = 'sonora-pwa-v24'/);
for(const value of ['workflow_dispatch:','branches: [feat/ios-release-prep]','runs-on: macos-latest','contents: read','timeout-minutes: 45','actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683','actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02','CODE_SIGNING_ALLOWED=NO','sdk_major < 26','sonora-ios-unsigned-xcarchive-not-installable'])assert(workflow.includes(value),value);
console.log('PASS: native local source and cleanup order, unsigned workflow, icon, bundle metadata, privacy manifest, and public route packaging');
