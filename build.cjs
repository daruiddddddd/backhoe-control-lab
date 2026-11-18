const fs=require('node:fs');
const path=require('node:path');
const here=__dirname;
fs.mkdirSync(path.join(here,"dist"),{recursive:true});
let html=fs.readFileSync(path.join(here,'index.template.html'),'utf8');
html=html.replace('<!-- VISUAL_STYLE -->','<style>'+fs.readFileSync(path.join(here,'visuals.css'),'utf8')+'</style>');
html=html.replace('<head>','<!-- Three.js license\n'+fs.readFileSync(path.join(here,'THREE-LICENSE.txt'),'utf8')+'\n-->\n<head>');
for(const [tag,file] of [['THREE_LIBRARY','three.min.js'],['CORE_SCRIPT','core.js'],['SOIL_SCRIPT','soil.js'],['FLIGHT_SCRIPT','flight.js'],['INPUT_SCRIPT','input-mode.js'],['VISUAL_SCRIPT','visuals.js'],['APP_SCRIPT','app.js']]){
 const content=fs.readFileSync(path.join(here,file),'utf8').replace(/<\/script/gi,'<\\/script');
 html=html.replace('<!-- '+tag+' -->',()=>'<script>\n'+content+'\n</script>');
}
fs.writeFileSync(path.join(here,'dist/index.html'),html);
fs.writeFileSync(path.join(here,'バックホー_操作確認.html'),html);
console.log('Built self-contained HTML: '+Buffer.byteLength(html)+' bytes');
