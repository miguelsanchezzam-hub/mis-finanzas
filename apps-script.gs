// Pega este código en Extensiones > Apps Script de tu Google Sheet "Mis finanzas".
// Cambia TOKEN por tu código secreto (el mismo que pusiste en la app).
// Si ya tenías una versión anterior: reemplaza todo, guarda y publica una NUEVA VERSIÓN
// (Implementar > Administrar implementaciones > lápiz > Versión: Nueva versión > Implementar).
// La URL no cambia.
var TOKEN = 'CAMBIA-ESTE-CODIGO';
var HOJA = 'Registro';

function out_(o){
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e){
  if(!e||!e.parameter||e.parameter.token!==TOKEN) return out_({ok:false,error:'token'});
  return out_({ok:true});
}
function dateStr_(v){
  var tz = Session.getScriptTimeZone();
  if(Object.prototype.toString.call(v)==='[object Date]') return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  var s = String(v).trim(), m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m) return m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2);
  return s;
}
function readItems_(sh){
  var last = sh.getLastRow(), items = [];
  if(last<2) return items;
  var vals = sh.getRange(2,1,last-1,6).getValues();
  vals.forEach(function(r,i){
    var f = String(r[5]||'');
    if(f.indexOf('app:')!==0) return;
    var id = f.slice(4), amt = Number(r[4]);
    if(!id||isNaN(amt)) return;
    var ts = parseInt(id.slice(0,-5),36);
    items.push({id:id,date:dateStr_(r[0]),type:String(r[1]),cat:String(r[2]),note:String(r[3]||''),amount:amt,created:(isFinite(ts)&&ts>1e12)?ts:(i+1),row:i+2});
  });
  return items;
}
function doPost(e){
  var lock = LockService.getScriptLock();
  try{
    lock.waitLock(25000);
    var body = JSON.parse(e.postData.contents);
    if(body.token!==TOKEN) return out_({ok:false,error:'token'});
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
    if(!sh) return out_({ok:false,error:'hoja'});

    // 1) borrados (solo columnas A:F, para no mover tus notas de la columna G)
    var dels = body.deletes||[];
    if(dels.length){
      var want = {}; dels.forEach(function(id){want[id]=1});
      var rows = readItems_(sh).filter(function(it){return want[it.id]}).map(function(it){return it.row}).sort(function(a,b){return b-a});
      rows.forEach(function(r){ sh.getRange(r,1,1,6).deleteCells(SpreadsheetApp.Dimension.ROWS); });
    }

    // 2) altas nuevas
    var current = readItems_(sh), seen = {};
    current.forEach(function(it){seen[it.id]=1});
    var vals = [];
    (body.rows||[]).forEach(function(r){
      if(!r||!r.id||seen[r.id]) return;
      var p = String(r.date).split('-');
      vals.push([new Date(+p[0],+p[1]-1,+p[2]), r.type, r.cat, r.note||'', Number(r.amount), 'app:'+r.id]);
      seen[r.id]=1;
    });
    if(vals.length){
      var last = sh.getLastRow(), colA = last>0 ? sh.getRange(1,1,last,1).getValues() : [], next = 2;
      for(var i=colA.length-1;i>=1;i--){ if(String(colA[i][0]).trim()!==''){ next=i+2; break; } }
      sh.getRange(next,1,vals.length,6).setValues(vals);
      sh.getRange(next,1,vals.length,1).setNumberFormat('dd/mm/yyyy');
    }

    // 3) ajustes compartidos (gana el más reciente)
    var props = PropertiesService.getScriptProperties();
    var stored = {ts:0,value:null};
    try{ stored = JSON.parse(props.getProperty('settings')||'') || stored; }catch(x){}
    var st = body.settings;
    if(st && st.value && Number(st.ts)>Number(stored.ts||0)){
      stored = {ts:Number(st.ts), value:st.value};
      props.setProperty('settings', JSON.stringify(stored));
    }

    var items = readItems_(sh).map(function(it){ delete it.row; return it; });
    return out_({ok:true, items:items, added:vals.length, settings:stored.value?stored:null});
  }catch(err){
    return out_({ok:false,error:String(err)});
  }finally{
    try{lock.releaseLock()}catch(x){}
  }
}
