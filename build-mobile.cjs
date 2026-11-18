// Optional HTTPS distribution package. Does not publish anything.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const out=path.join(__dirname,'mobile-web');fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(__dirname,'dist/index.html'),'utf8');
html=html.replace('</head>','<link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icon-192.png"><link rel="apple-touch-icon" href="./icon-180.png"><meta name="theme-color" content="#14232c"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"></head>');
html=html.replace('<div class="intro">','<div class="intro"><div style="font-size:11px;line-height:1.8;padding:10px 0 18px;color:#a8bec8">iPad・iPhone：Safariの共有 → ホーム画面に追加。Android：ブラウザのメニュー → アプリをインストール。<br><span id="offline-ready" role="status">初回のオフライン準備中…</span></div>');
html=html.replace('</body>',`<script>
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{document.getElementById('offline-ready').textContent='オフラインの準備ができました。ホーム画面から起動できます。';}).catch(()=>{document.getElementById('offline-ready').textContent='オフライン保存を完了できませんでした。通信を確認して再度開いてください。';});
}else{document.getElementById('offline-ready').textContent='ホーム画面版はHTTPSで開いてください。PC用の単体HTMLはそのままオフラインで使えます。';}
</script></body>`);
fs.writeFileSync(path.join(out,'index.html'),html);
fs.copyFileSync(path.join(__dirname,'dist/index.html'),path.join(out,'offline.html'));
const manifest={id:'./',name:'バックホー操作練習室',short_name:'バックホー',lang:'ja',start_url:'./',scope:'./',display:'standalone',background_color:'#14232c',theme_color:'#14232c',icons:[192,512].map(n=>({src:'./icon-'+n+'.png',sizes:n+'x'+n,type:'image/png',purpose:'any maskable'}))};
fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify(manifest,null,2));
const hash=crypto.createHash('sha256').update(html).digest('hex').slice(0,12);
fs.writeFileSync(path.join(out,'sw.js'),`const PREFIX='backhoe-field-',CACHE=PREFIX+'${hash}';
const assets=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png','./offline.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(assets)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}return response;}).catch(()=>caches.match('./index.html')));}else{event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));}});
`);
// Draw the same geometric orange cabin mark as the page header, as PNG icons.
function crc(buffer){let c=0xffffffff;for(const b of buffer){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),length=Buffer.alloc(4),check=Buffer.alloc(4);length.writeUInt32BE(data.length);check.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([length,t,data,check]);}
for(const n of [180,192,512]){const raw=Buffer.alloc((n*4+1)*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n,v=y/n,i=y*(n*4+1)+1+x*4;let rgb=[20,35,44];if(u>.24&&u<.76&&v>.22&&v<.78&&v>u-.28&&v<u+.45)rgb=[255-Math.floor(v*20),210-Math.floor(v*60),131-Math.floor(v*55)];if(u>.36&&u<.58&&v>.34&&v<.54)rgb=[27,59,73];raw.set([...rgb,255],i);}const header=Buffer.alloc(13);header.writeUInt32BE(n);header.writeUInt32BE(n,4);header[8]=8;header[9]=6;fs.writeFileSync(path.join(out,'icon-'+n+'.png'),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));}
fs.writeFileSync(path.join(out,'利用方法.txt'),'スマホ・iPad用のホーム画面版。まだ公開していません。\nこのフォルダーをそのままHTTPSの静的サイトへ配置すると使えます。GitHub Pagesのサブフォルダーにも対応しています。\n初回は通信ありで開き、「オフラインの準備ができました」を確認してホーム画面に追加してください。以後は保存が残る間オフラインで起動できます。端末がサイトデータを削除した場合は再読み込みが必要です。\nPCでは隣のバックホー_操作確認.htmlを直接開けば、最初からネット接続不要です。\n');
console.log('Prepared mobile-web package (local only): '+hash);
