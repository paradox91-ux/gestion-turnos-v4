// Uso: node scripts/aplicar-marca.js <id-de-marca>
// Aplica una marca (colores, nombre, iconos) sobre el proyecto antes de compilar.
const fs=require('fs'), path=require('path');
const id=process.argv[2]||'turnos';
const dir=path.join(__dirname,'..','marcas',id);
if(!fs.existsSync(path.join(dir,'marca.json'))){console.error('No existe la marca: '+id);process.exit(1);}
const m=JSON.parse(fs.readFileSync(path.join(dir,'marca.json'),'utf8'));
const root=path.join(__dirname,'..');

// 1) capacitor.config.json
const cfgPath=path.join(root,'capacitor.config.json');
const cfg=JSON.parse(fs.readFileSync(cfgPath,'utf8'));
cfg.appId=m.appId; cfg.appName=m.appName;
if(m.paleta&&m.paleta.claro&&m.paleta.claro.bg) cfg.backgroundColor=m.paleta.claro.bg;
fs.writeFileSync(cfgPath,JSON.stringify(cfg,null,2));

// 2) www/index.html
const hp=path.join(root,'www','index.html');
let h=fs.readFileSync(hp,'utf8');
function once(a,b){ if(h.indexOf(a)<0){console.error('No se encontró: '+a);process.exit(1);} h=h.split(a).join(b); }
if(m.appName!=='Turnos'){
  once('<title>Turnos</title>','<title>'+m.appName+'</title>');
  once("'Turnos-'+slugName","'"+m.appName+"-'+slugName");
  once('<p class="set-foot">Turnos','<p class="set-foot">'+m.appName);
}
if(m.salon){
  once('Mi salón',m.salon);
}
if(m.paleta){
  const vars=o=>Object.keys(o).map(k=>'--'+k+':'+o[k]+';').join('');
  const css='<style id="marca">'+
    ':root{'+vars(m.paleta.claro||{})+'}'+
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){'+vars(m.paleta.oscuro||{})+'}}'+
    ':root[data-theme="dark"]{'+vars(m.paleta.oscuro||{})+'}'+
    '</style>\n';
  once('</head>',css+'</head>');
}
fs.writeFileSync(hp,h);

// 3) iconos
const ad=path.join(dir,'assets');
if(fs.existsSync(ad)){
  fs.readdirSync(ad).forEach(f=>fs.copyFileSync(path.join(ad,f),path.join(root,'assets',f)));
}

// 4) variables para el workflow
const env=['MARCA_ID='+m.id,'MARCA_NOMBRE='+m.appName,'MARCA_APK='+m.archivoApk,'MARCA_TAG='+m.release,'MARCA_FONDO='+m.fondoIcono].join('\n')+'\n';
if(process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV,env);
console.log('Marca aplicada: '+m.id+' ('+m.appName+')');
