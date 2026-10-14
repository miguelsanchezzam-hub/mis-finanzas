// Pega este código en Extensiones > Apps Script de tu Google Sheet "Mis finanzas".
// 1) Cambia TOKEN por un código secreto tuyo (el mismo que pondrás en la app).
var TOKEN = 'CAMBIA-ESTE-CODIGO';
var HOJA = 'Registro';

function out_(o){
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e){
  if(!e||!e.parameter||e.parameter.token!==TOKEN) return out_({ok:false,error:'token'});
  return out_({ok:true});
}

function doPost(e){
  var lock = LockService.getScriptLock();
  try{
    lock.waitLock(20000);
    var body = JSON.parse(e.postData.contents);
    if(body.token!==TOKEN) return out_({ok:false,error:'token'});
    var rows = body.rows||[];
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
    if(!sh) return out_({ok:false,error:'hoja'});
    var last = sh.getLastRow();
    var colA = last>0 ? sh.getRange(1,1,last,1).getValues() : [];
    var next = 1;
    for(var i=colA.length-1;i>=0;i--){ if(String(colA[i][0]).trim()!==''){ next=i+2; break; } }
    var colF = last>0 ? sh.getRange(1,6,last,1).getValues() : [];
    var seen = {};
    colF.forEach(function(r){ if(r[0]) seen[String(r[0])]=1; });
    var vals = [];
    rows.forEach(function(r){
      var id = 'app:'+r.id;
      if(seen[id]) return;
      var p = String(r.date).split('-');
      vals.push([new Date(+p[0],+p[1]-1,+p[2]), r.type, r.cat, r.note||'', Number(r.amount), id]);
    });
    if(vals.length){
      sh.getRange(next,1,vals.length,6).setValues(vals);
      sh.getRange(next,1,vals.length,1).setNumberFormat('dd/mm/yyyy');
    }
    return out_({ok:true,added:vals.length,skipped:rows.length-vals.length});
  }catch(err){
    return out_({ok:false,error:String(err)});
  }finally{
    try{lock.releaseLock()}catch(x){}
  }
}
