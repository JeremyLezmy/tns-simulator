/* THEME + PIN */
function applyTheme(mode){
  var root = document.documentElement;
  root.setAttribute('data-theme', mode || 'auto');
  try{ localStorage.setItem('simv122_theme', mode || 'auto'); }catch(e){}
}
function togglePin(v){
  var tb=document.getElementById('topbar');
  if(v==='off'){ tb.classList.add('unpinned'); } else { tb.classList.remove('unpinned'); }
  try{ localStorage.setItem('simv122_pin', v); }catch(e){}
}
(function(){ 
  try { localStorage.setItem('simv122_theme', 'dark'); } catch(e){}
  try { localStorage.setItem('simv122_pin', 'off'); } catch(e){}
  var savedTheme=null, savedPin=null;
  try{ savedTheme = localStorage.getItem('simv122_theme'); savedPin=localStorage.getItem('simv122_pin'); }catch(e){}
  if(savedTheme){ document.getElementById('themeSel').value = savedTheme; applyTheme(savedTheme); } else { document.getElementById('themeSel').value = 'dark';
  applyTheme('dark'); }
  if (savedPin) {
  document.getElementById('pinSel').value = savedPin;
  togglePin(savedPin);
} else {
  document.getElementById('pinSel').value = 'off';
  togglePin('off');
}
})();

function switchMode(v){
  var tns = document.getElementById('blocTNS');
  var sasu = document.getElementById('blocSASU');
  var sisu = document.getElementById('blocSASUIS');
  var cashSel = document.getElementById('cashOpts');
  if(v==='tns'){ tns.style.display='block'; sasu.style.display='none'; sisu.style.display='none'; document.getElementById('syncSource').value='tns'; cashSel.value='tns_spouse'; }
  else if(v==='sasuIR'){ tns.style.display='none'; sasu.style.display='block'; sisu.style.display='none'; document.getElementById('syncSource').value='sasu'; cashSel.value='sasu_bnc_spouse'; }
  else { tns.style.display='none'; sasu.style.display='none'; sisu.style.display='block'; document.getElementById('syncSource').value='sasuIS'; cashSel.value='sasu_is_spouse'; }
  syncIR();
}

/* Console helpers */
function log(msg){ var c=document.getElementById('console'); if(!c) return; var t=new Date().toLocaleTimeString('fr-FR'); c.textContent += '['+t+'] '+msg+'\\n'; c.scrollTop=c.scrollHeight; }
function logIR(msg){ var c=document.getElementById('consoleIR'); if(!c) return; var t=new Date().toLocaleTimeString('fr-FR'); c.textContent += '['+t+'] '+msg+'\\n'; c.scrollTop=c.scrollHeight; }
window.onerror=function(message,source,lineno,colno,error){ log('ERREUR: '+message+' ('+lineno+':'+colno+')'); logIR('ERREUR: '+message+' ('+lineno+':'+colno+')'); return false; };


/* === Arrondi d'affichage === */
var DISP_DEC = 0;
function applyRounding(val){
  DISP_DEC = (val === 'disp2') ? 2 : 0;
  try { localStorage.setItem('simv122_round', val); } catch(e){}
  updateAll(true); // refresh with projection
}
// Restore saved preference
(function(){
  var saved = null;
  try { saved = localStorage.getItem('simv122_round'); } catch(e){}
  if(saved){
    DISP_DEC = (saved === 'disp2') ? 2 : 0;
    var sel = document.getElementById('roundSel');
    if(sel){ sel.value = saved; }
  }
})();


/* Utils */
function fmtEUR(n){ return (isFinite(n)? n.toLocaleString('fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:DISP_DEC,maximumFractionDigits:DISP_DEC}):'–'); }
function fmtPct(n){ return (isFinite(n)? (n*100).toFixed(1).replace('.',',')+' %' : '–'); }
function val(id){ var el=document.getElementById(id); if(!el) return 0; var raw=(el.value||'').toString().replace(',', '.'); var x=parseFloat(raw); return isFinite(x)?x:0; }

/* NOTES */
var NOTES = {
  howto:
    "<h3>Guide d’utilisation</h3>"+
    "<ol>"+
    "<li>Choisissez le <b>mode</b> (TNS / SASU-IR / SASU-IS) en haut.</li>"+
    "<li>Renseignez les paramètres de l’<b>année 1</b> et les <b>croissances</b>.</li>"+
    "<li>Cliquez sur <b>Calculer (année 1)</b> (selon le mode) – la projection se lance automatiquement.</li>"+
    "<li>Le bloc <b>IR du foyer</b> se synchronise avec le mode et agrège salaires, BNC/quote-part, dividendes (au barème si choisi), et le micro-BNC du conjoint.</li>"+
    "<li>Le <b>Net foyer</b> = encaissements (selon le mode) − IR. Il diffère du <b>RNI</b> (base fiscale).</li>"+
    "<li>Exportez via <b>CSV</b> (FR/Intl).</li>"+
    "</ol>",
  params:
    "<h3>Paramètres & hypothèses</h3>"+
    "<ul>"+
    "<li><b>PASS</b> & <b>barème IR</b> indexés par vos champs d’inflation.</li>"+
    "<li><b>TNS</b> : assiette A=74 % × R ; postes mal./IJ/retraite/RCI/ID/AF plafonnés en PASS ; CSG-CRDS 9,7 % de A (option de neutralisation IS).</li>"+
    "<li><b>SASU-IR</b> : salaire imposable = 90 % brut ; PS sur quote-part au taux paramétré (9,7 % ou 17,2 %).</li>"+
    "<li><b>SASU-IS</b> : coût employeur = brut × (1 + charges patronales %) ; résultat imposable = marge − coût employeur ; IS = 15 % sur la fraction ≤ seuil PME, puis taux normal ; dividendes = % du résultat après IS ; PFU (12,8 % + 17,2 %) ou barème (abattement 40 % + PS 17,2 %).</li>"+
    "<li><b>SMIC & trimestres</b> : 1 trimestre = <b>150 × SMIC horaire brut</b> ; 4 trimestres = 600 × SMIC horaire brut.</li>"+
    "<li><b>PUMA</b> : en l’absence de revenus d’activité, la CSM peut être due. Le simulateur signale simplement le risque (pas de calcul fin).</li>"+
    "<li>Les taux de cotisations <b>assimilé salarié</b> varient selon statut (cadre/non cadre, exonérations). On laisse des <b>taux moyens</b> modifiables.</li>"+
    "</ul>",
  sources:
    "<h3>Sources officielles</h3>"+
    "<ul>"+
    "<li>Barème IR 2025 (revenus 2024) — Service-Public : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/actualites/A18045'>A18045</a></li>"+
    "<li>Brochure pratique IR 2025 — impots.gouv : <a target='_blank' rel='noopener' href='https://www.impots.gouv.fr/www2/fichiers/documentation/brochure/ir_2025/accueil.htm'>IR 2025</a></li>"+
    "<li>PASS 2025 = 47 100 € — Service-Public : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/actualites/A15386'>A15386</a></li>"+
    "<li>IS — Taux normal 25 % et réduit 15 % (seuil 42 500 €) — Service-Public Pro : <a target='_blank' rel='noopener' href='https://entreprendre.service-public.fr/vosdroits/F23575'>F23575</a></li>"+
    "<li>Dividendes : PFU ou barème + abattement 40 % — Service-Public Pro : <a target='_blank' rel='noopener' href='https://entreprendre.service-public.fr/vosdroits/F32963'>F32963</a> • Service-Public Particulier : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/vosdroits/F34913/1_7'>F34913</a></li>"+
    "<li>Validation des trimestres : <b>150 × SMIC horaire brut</b> — Service-Public : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/vosdroits/F1761'>F1761</a></li>"+
    "<li>PUMA / CSM — URSSAF : <a target='_blank' rel='noopener' href='https://www.urssaf.fr/accueil/particulier/beneficiaire-puma.html'>Bénéficiaire PUMa</a></li>"+
    "</ul>"+
    "<p>Vérifiez chaque année les taux exacts (barème IR, PASS, SMIC, IS) et conditions PME pour l’IS à 15 %.</p>"
};
function showNote(key, el){
  var c=document.getElementById('noteContent'); c.innerHTML = NOTES[key] || '';
  var tabs=document.querySelectorAll('.tabs .tab'); for(var i=0;i<tabs.length;i++){ tabs[i].classList.remove('active'); }
  if(el) el.classList.add('active');
}
showNote('howto');

/* IR */
function computeTaxFromBareme(baseParPart, indexPct){
  var factor = 1 + (indexPct/100);
  var steps = [
    {from:0,              to:11497*factor, rate:0.00},
    {from:11497*factor,   to:29315*factor, rate:0.11},
    {from:29315*factor,   to:83823*factor, rate:0.30},
    {from:83823*factor,   to:180294*factor, rate:0.41},
    {from:180294*factor,  to:Infinity, rate:0.45}
  ];
  var slices=[], tax=0, tmi=0, taxedBase=0;
  for(var i=0;i<steps.length;i++){
    var a=steps[i].from, b=steps[i].to, r=steps[i].rate;
    var base = Math.max(0, Math.min(baseParPart, b) - a);
    if(base>0){
      var t = base * r;
      slices.push({base:base, rate:r, tax:t});
      tax += t; taxedBase += base; tmi = r;
      if(baseParPart <= b) break;
    }
  }
  return {tax:tax, tmiRate:tmi, slices:slices, taxedBase:taxedBase, steps:steps};
}
function buildIrTable(res, parts){
  var rows = res.slices.map(function(s, idx){
    return '<tr><td>Tranche '+(idx+1)+'</td><td class="num">'+fmtEUR(s.base)+'</td><td class="num">'+(s.rate*100).toFixed(0)+' %</td><td class="num">'+fmtEUR(s.tax)+'</td></tr>';
  }).join('');
  if(!rows) rows = '<tr><td colspan="4" class="muted">Aucune tranche taxée</td></tr>';
  document.getElementById('tblIr').innerHTML = rows;
  document.getElementById('sumBasePart').textContent = fmtEUR(res.taxedBase);
  document.getElementById('sumTaxPart').textContent = fmtEUR(res.tax);
  document.getElementById('sumBaseFoyer').textContent = fmtEUR(res.taxedBase*parts);
  document.getElementById('sumTaxFoyer').textContent = fmtEUR(res.tax*parts);
}
function calcIR(){
  var parts=Math.max(1,val('parts'));
  var rSal=val('rSal'), rBnc=val('rBnc'), rDivIR=val('rDivIR');
  var caSp=val('caSpouse');
  var baseSpouse=0.66*(caSp*12);
  var dedCsg=0;
  if (document.getElementById('deductCsg').value==='1' && window.__A_tns){ dedCsg = 0.068 * window.__A_tns; }
  var RNI = Math.max(0, rSal + rBnc + rDivIR + baseSpouse - dedCsg);
  var res = computeTaxFromBareme(RNI/parts, val('inflation'));
  var IR = res.tax * parts;
  document.getElementById('rniFoyer').textContent = fmtEUR(RNI);
  document.getElementById('irOut').textContent = fmtEUR(IR);
  document.getElementById('tmiOut').textContent = (res.tmiRate*100).toFixed(0)+' %';
  buildIrTable(res, parts);

  // Net dispo encaissements (année 1)
  var mode = document.getElementById('cashOpts').value;
  var enc = 0;
  if(mode==='tns_spouse'){
    enc += (window.__Rout||0);
    enc += caSp*12;
  }else if(mode==='tns_only'){
    enc += (window.__Rout||0);
  }else if(mode==='sasu_bnc_spouse'){
    enc += (window.__SASUSalaire||0);
    enc += (window.__SASUBnc||0);
    enc += caSp*12;
  }else if(mode==='sasu_is_spouse'){
    enc += (window.__SISU_NetSal||0);
    enc += (window.__SISU_DivNet||0);
    enc += caSp*12;
  }
  var net = enc - IR;
  document.getElementById('netFoyer').textContent = fmtEUR(net);
  window.__IR_state = {parts:parts, rSal:rSal, rBnc:rBnc, rDivIR:rDivIR, baseSpouse:baseSpouse, dedCsg:dedCsg, RNI:RNI, res:res, IR:IR, enc:enc, net:net, mode:mode};
  logIR('calcIR — RNI='+RNI.toFixed(0)+' IR='+IR.toFixed(0)+' net='+net.toFixed(0));
}
function syncIR(){
  var src=document.getElementById('syncSource').value;
  if(src==='tns'){
    document.getElementById('rSal').value=Math.round(0.9*(window.__Rout||0));
    document.getElementById('rBnc').value=0; document.getElementById('rDivIR').value=0;
    document.getElementById('cashOpts').value='tns_spouse';
  }else if(src==='sasu'){
    document.getElementById('rSal').value=Math.round(0.9*(window.__SASUSalaire||0));
    document.getElementById('rBnc').value=Math.round(window.__SASUBnc||0); document.getElementById('rDivIR').value=0;
    document.getElementById('cashOpts').value='sasu_bnc_spouse';
  }else if(src==='sasuIS'){
    document.getElementById('rBnc').value=0;
    var salImp = 0.9*(window.__SISU_SalBrut||0);
    document.getElementById('rSal').value=Math.round(salImp);
    document.getElementById('rDivIR').value=Math.round(window.__SISU_DivIRBase||0);
    document.getElementById('cashOpts').value='sasu_is_spouse';
  }
  calcIR();
}

/* TNS */
function tnsCotisations(R,PASS,includeCsg,CFP){
  var A=0.74*R;
  var A_pass=Math.min(A,PASS);
  var maladie=0.085*Math.min(A,3*PASS);
  var ij=0.005*Math.min(A,5*PASS);
  var retBase=0.1775*A_pass + 0.0072*Math.min(Math.max(A-PASS,0),4*PASS);
  var rci=0.081*A_pass + 0.091*Math.min(Math.max(A-PASS,0),3*PASS);
  var id=0.013*A_pass;
  var af=0;
  if(A>1.4*PASS) af=0.031*A;
  else if(A>1.1*PASS){ var rate=((A-1.1*PASS)/(0.3*PASS))*0.031; af=rate*A; }
  var cotSansCSG=maladie+ij+retBase+rci+id+af+(CFP||0);
  var csg=0.097*A;
  var total=cotSansCSG + csg;
  if(!includeCsg) total=cotSansCSG;
  return {A:A, maladie:maladie, ij:ij, retBase:retBase, rci:rci, id:id, af:af, cotSansCSG:cotSansCSG, csg:csg, total:total};
}
function solveRForFullRemu(CA,chargesPct,chargesFixes,PASS,includeCsg,CFP){
  var dispo=CA*(1-(chargesPct/100))-(chargesFixes||0);
  if(dispo<=0) return {R:0,dispo:dispo,cot:tnsCotisations(0,PASS,includeCsg,CFP)};
  var lo=0, hi=Math.max(200000,dispo*1.5);
  for(var i=0;i<20;i++){
    var needHi=hi+tnsCotisations(hi,PASS,includeCsg,CFP).total;
    if(needHi>=dispo) break; hi*=1.5;
  }
  var R=0,cot=null;
  for(var j=0;j<150;j++){
    var mid=(lo+hi)/2; cot=tnsCotisations(mid,PASS,includeCsg,CFP);
    var need=mid+cot.total;
    if(Math.abs(need-dispo)<0.5){ R=mid; break; }
    if(need>dispo) hi=mid; else lo=mid; R=mid;
  }
  cot=tnsCotisations(R,PASS,includeCsg,CFP);
  return {R:R,dispo:dispo,cot:cot};
}
function fillTnsTable(R,cot){
  var items=[
    ['A = 74 % × R', cot.A],
    ['Maladie-maternité (8,5 % ≤ 3 PASS)', cot.maladie],
    ['Indemnités journalières (0,5 % ≤ 5 PASS)', cot.ij],
    ['Retraite de base (17,75 % ≤ PASS + 0,72 % 1–5 PASS)', cot.retBase],
    ['Retraite complémentaire RCI (8,1 % ≤ PASS + 9,1 % 1–4 PASS)', cot.rci],
    ['Invalidité-décès (1,3 % ≤ PASS)', cot.id],
    ['Allocations familiales modulées', cot.af]
  ];
  var rows = items.map(function(it){
    var pr = (R>0? it[1]/R : 0);
    return '<tr><td>'+it[0]+'</td><td class="num">'+fmtEUR(it[1])+'</td><td class="num">'+fmtPct(pr)+'</td></tr>';
  }).join('');
  document.getElementById('tblTns').innerHTML = rows;
  document.getElementById('sumHorsCsg').textContent = fmtEUR(cot.cotSansCSG);
  document.getElementById('sumHorsCsgPct').textContent = (R>0?fmtPct(cot.cotSansCSG/R):'–');
  document.getElementById('sumCsg').textContent = fmtEUR(cot.csg);
  document.getElementById('sumCsgPct').textContent = (R>0?fmtPct(cot.csg/R):'–');
  var tot = cot.cotSansCSG + cot.csg;
  document.getElementById('sumTot').textContent = fmtEUR(tot);
  document.getElementById('sumTotPct').textContent = (R>0?fmtPct(tot/R):'–');
  window.__TNS_state = {R:R, cot:cot, items:items, tot:tot};
}
function mainCalc(triggerProj){
  var PASS=val('pass');
  var includeCsg=(document.getElementById('includeCsg').value==='1');
  var CFP=Math.max(0,val('cfp'));
  var CA=val('ca');
  var chargesPct=val('chargesPct');
  var chargesFixes=val('chargesFixes');
  var res=solveRForFullRemu(CA,chargesPct,chargesFixes,PASS,includeCsg,CFP);
  var R=res.R, dispo=res.dispo, cot=res.cot;
  window.__Rout=R; window.__A_tns=cot.A;
  document.getElementById('margeOut').textContent=fmtEUR(dispo);
  document.getElementById('Rout').textContent=fmtEUR(R);
  document.getElementById('Rratio').textContent='R / CA : '+fmtPct(R/Math.max(CA,1));
  document.getElementById('cotHorsCsg').textContent=fmtEUR(cot.cotSansCSG);
  document.getElementById('cotHorsCsgPct').textContent='soit '+fmtPct(cot.cotSansCSG/Math.max(R,1))+' de R';
  document.getElementById('csgOut').textContent=fmtEUR(cot.csg);
  var total=cot.cotSansCSG + (includeCsg?cot.csg:0);
  document.getElementById('totalTns').textContent=fmtEUR(total);
  document.getElementById('totalTnsPct').textContent='soit '+fmtPct(total/Math.max(R,1))+' de R';
  fillTnsTable(R,cot);
  if(document.getElementById('modeSel').value==='tns'){ document.getElementById('syncSource').value='tns'; document.getElementById('cashOpts').value='tns_spouse'; }
  syncIR();
  if(triggerProj) projectYears();
  log('mainCalc — CA='+CA+' R='+Math.round(R));
}

/* SASU IR */
function calcSASU(triggerProj){
  var salaire=Math.max(0,val('sasuSalaire'));
  var bnc=Math.max(0,val('sasuBnc'));
  var ps=Math.max(0,parseFloat(document.getElementById('psRate').value)||0.097);
  var salImp=0.9*salaire; var psDue=ps*bnc;
  window.__SASUSalaire=salaire; window.__SASUBnc=bnc;
  document.getElementById('sasuSalaireImp').textContent=fmtEUR(salImp);
  document.getElementById('sasuPs').textContent=fmtEUR(psDue);
  document.getElementById('sasuPsRateText').textContent='Taux appliqué : '+(ps*100).toFixed(1).replace('.',',')+' %';
  document.getElementById('sasuRni').textContent=fmtEUR(salImp+bnc);
  var items=[['Salaire brut', salaire],['Salaire imposable (-10%)', salImp],['Quote-part BNC', bnc],['PS sur quote-part', psDue]];
  var rows = items.map(function(it){ return '<tr><td>'+it[0]+'</td><td class="num">'+fmtEUR(it[1])+'</td></tr>'; }).join('');
  document.getElementById('tblSasu').innerHTML = rows;
  document.getElementById('sumSasuEnc').textContent = fmtEUR(salaire + bnc);
  if(document.getElementById('modeSel').value==='sasuIR'){ document.getElementById('syncSource').value='sasu'; document.getElementById('cashOpts').value='sasu_bnc_spouse'; }
  if(document.getElementById('syncSource').value==='sasu'){ syncIR(); }
  window.__SASU_state = {salaire:salaire, salImp:salImp, bnc:bnc, psRate:ps, psDue:psDue};
  if(triggerProj) projectYears();
  log('calcSASU — salaire='+salaire+' bnc='+bnc);
}

/* SASU IS */
function minSalary4Quarters(smicHour){ return 600 * smicHour; } // 150 × smic × 4
function updateSISUHelper(){
  var mode=document.getElementById('sisuSalaryMode').value;
  var smic=val('smicHour');
  var min= minSalary4Quarters(smic);
  var info="Seuil 4 trimestres (brut annuel) ≈ 600 × SMIC horaire = "+fmtEUR(min);
  document.getElementById('sisuMinInfo').textContent = info;
  if(mode==='min4q'){ document.getElementById('sisuSalaire').value = Math.round(min); }
}
function calcSISU(triggerProj){
  var CA=val('sisuCA');
  var chargesPct=val('sisuChargesPct');
  var chargesFix=val('sisuChargesFix');
  var marge = CA*(1 - chargesPct/100) - chargesFix;

  var smic=val('smicHour');
  var salMode=document.getElementById('sisuSalaryMode').value;
  var salBrut = (salMode==='min4q') ? minSalary4Quarters(smic) : val('sisuSalaire');

  var rateSal=val('rateSal')/100, ratePat=val('ratePat')/100;
  var costEmployeur = salBrut*(1+ratePat);
  var salNet = salBrut*(1-rateSal);

  var resImposable = Math.max(0, marge - costEmployeur);

  var isRedThr=val('isRedThr'); var isRate=val('isRate')/100;
  var isRed = Math.min(resImposable, Math.max(0,isRedThr))*0.15;
  var isNorm = Math.max(0, resImposable - Math.max(0,isRedThr)) * isRate;
  var isTotal = isRed + isNorm;

  var resApresIS = Math.max(0, resImposable - isTotal);
  var distRate=val('distRate')/100;
  var divBrut = resApresIS * distRate;

  var divMode=document.getElementById('divMode').value;
  var psDiv = 0.172 * divBrut;
  var irDivPFU = 0.128 * divBrut;
  var divNetPFU = divBrut - psDiv - irDivPFU;
  var divIRBase = 0.6 * divBrut; // abattement 40 %
  var divNetBareme = divBrut - psDiv; // IR payé via barème

  // Save globals for IR & Net
  window.__SISU_SalBrut = salBrut;
  window.__SISU_NetSal = salNet;
  window.__SISU_DivBrut = divBrut;
  window.__SISU_DivIRBase = (divMode==='bareme') ? divIRBase : 0;
  window.__SISU_DivNet = (divMode==='pfu') ? divNetPFU : divNetBareme;
  window.__SISU_IS = isTotal;
  window.__SISU_PS = psDiv;
  window.__SISU_DivMode = divMode;

  // KPIs
  document.getElementById('sisuKpiSal').textContent = fmtEUR(salBrut);
  document.getElementById('sisuKpiRes').textContent = fmtEUR(resImposable);
  document.getElementById('sisuKpiIS').textContent = fmtEUR(isTotal);
  document.getElementById('sisuKpiDivBrut').textContent = fmtEUR(divBrut);
  document.getElementById('sisuKpiDivNet').textContent = fmtEUR(window.__SISU_DivNet);

  // Table details
  var items=[
    ['CA', CA],
    ['Charges externes ('+chargesPct.toFixed(1).replace('.',',')+' %)', -CA*(chargesPct/100)],
    ['Autres charges fixes', -chargesFix],
    ['Marge avant rémunérations', marge],
    ['Salaire brut', -salBrut],
    ['Charges patronales ('+(ratePat*100).toFixed(1).replace('.',',')+' %)', -salBrut*ratePat],
    ['Coût employeur total', -costEmployeur],
    ['Résultat imposable IS', resImposable],
    ['IS 15 % (jusqu’au seuil)', -isRed],
    ['IS taux normal', -isNorm],
    ['IS total', -isTotal],
    ['Résultat après IS', resApresIS],
    ['Dividendes bruts ('+(distRate*100).toFixed(0)+' % distrib.)', -divBrut],
    ['Prélèvements sociaux sur dividendes (17,2 %)', -psDiv]
  ];
  if(divMode==='pfu'){ items.push(['IR sur dividendes (PFU 12,8 %)', -irDivPFU]); items.push(['Dividendes nets perçus (PFU)', divNetPFU]); }
  else { items.push(['Base imposable IR (abattement 40 %)', divIRBase]); items.push(['Dividendes nets perçus (avant IR barème)', divNetBareme]); }

  var rows = items.map(function(it){ return '<tr><td>'+it[0]+'</td><td class="num">'+fmtEUR(it[1])+'</td></tr>'; }).join('');
  document.getElementById('tblSISU').innerHTML = rows;
  document.getElementById('sumSISUEnc').textContent = fmtEUR(salNet + window.__SISU_DivNet);

  // Sync IR if selected
  if(document.getElementById('modeSel').value==='sasuIS'){ document.getElementById('syncSource').value='sasuIS'; document.getElementById('cashOpts').value='sasu_is_spouse'; }
  if(document.getElementById('syncSource').value==='sasuIS'){ syncIR(); }
  if(triggerProj) projectYears();
}

/* PROJECTION */
function projectYears(){
  // Ensure year-1 states are up-to-date for consistency
  var mode = document.getElementById('modeSel').value;
  if(mode==='tns'){ mainCalc(false); } else if(mode==='sasuIR'){ calcSASU(false); } else { calcSISU(false); }
  calcIR();

  var y0 = Math.round(val('startYear')||2025);
  var n = Math.max(1, Math.round(val('years')||1));
  var infl = val('inflation');
  var pass0 = val('pass');
  var gPass = val('passGrow')/100;

  var smic0 = val('smicHour')||11.65;
  var gSmic = (document.getElementById('smicGrow')? val('smicGrow')/100 : 0.02);

  var spouseCA0 = val('caSpouse')*12; var gSp = val('growth')/100;

  var tbody = document.getElementById('tblProj'); tbody.innerHTML='';
  var sumCA=0,sumR=0,sumB=0,sumDivB=0,sumDivN=0,sumCot=0,sumRNI=0,sumIR=0,sumNet=0;

  var PASS = pass0; var SMIC = smic0;

  var CA = (mode==='tns'? val('ca') : (mode==='sasuIS'? val('sisuCA') : 0));
  var gCA = (mode==='tns'? val('caGrow')/100 : (mode==='sasuIS'? val('sisuCAGrow')/100 : 0));
  var chargesPct = (mode==='tns'? val('chargesPct') : (mode==='sasuIS'? val('sisuChargesPct') : 0));
  var chargesFix0 = (mode==='tns'? val('chargesFixes') : (mode==='sasuIS'? val('sisuChargesFix') : 0));
  var CFP = Math.max(0,val('cfp'));
  var includeCsg = (document.getElementById('includeCsg').value==='1');

  var sal0IR = val('sasuSalaire'); var gSalIR = val('sasuSalaireGrow')/100;
  var bnc0 = val('sasuBnc'); var gBnc = val('sasuBncGrow')/100;
  var ps = Math.max(0, parseFloat(document.getElementById('psRate').value)||0.097);

  var salModeIS = (document.getElementById('sisuSalaryMode')? document.getElementById('sisuSalaryMode').value : 'manual');
  var sal0IS = val('sisuSalaire');
  var rateSal=val('rateSal')/100, ratePat=val('ratePat')/100;
  var isRedThr=val('isRedThr'); var isRate=val('isRate')/100;
  var distRate=val('distRate')/100; var divMode=(document.getElementById('divMode')? document.getElementById('divMode').value : 'pfu');

  for(var k=0;k<n;k++){
    var year = y0 + k;
    if(k>0){
      PASS = PASS * (1+gPass);
      SMIC = SMIC * (1+gSmic);
      CA = CA * (1+gCA);
      chargesFix0 = chargesFix0; // constant
      sal0IR = sal0IR * (1+gSalIR);
      bnc0 = bnc0 * (1+gBnc);
    }
    var spouseCA = spouseCA0 * Math.pow(1+gSp, k);
    var parts = Math.max(1,val('parts'));
    var indexBar = infl * k;

    if(mode==='tns'){
      var res=solveRForFullRemu(CA,chargesPct,chargesFix0,PASS,includeCsg,CFP);
      var R=res.R; var cot=res.cot; var cotTot=cot.cotSansCSG + (includeCsg?cot.csg:0);
      var rSal = 0.9 * R; var baseSpouse = 0.66*spouseCA; var dedCsg = (document.getElementById('deductCsg').value==='1') ? 0.068*cot.A : 0;
      var RNI = Math.max(0, rSal + baseSpouse - dedCsg);
      var irRes = computeTaxFromBareme(RNI/parts, indexBar); var IR = irRes.tax * parts;
      var enc = R + spouseCA; var net = enc - IR;
      var tr='<tr><td>'+year+'</td><td class="num">'+fmtEUR(PASS)+'</td><td class="num">'+fmtEUR(SMIC)+'</td><td>TNS</td>'+
        '<td class="num">'+fmtEUR(CA)+'</td><td class="num">'+fmtEUR(R)+'</td><td class="num">–</td>'+
        '<td class="num">–</td><td class="num">–</td><td>–</td>'+
        '<td class="num">'+fmtEUR(cotTot)+'</td><td class="num">'+fmtEUR(RNI)+'</td><td class="num">'+fmtEUR(IR)+'</td><td class="num">'+fmtEUR(net)+'</td></tr>';
      tbody.innerHTML += tr;
      sumCA+=CA; sumR+=R; sumCot+=cotTot; sumRNI+=RNI; sumIR+=IR; sumNet+=net;
    }else if(mode==='sasuIR'){
      var salaire = sal0IR; var bnc = bnc0;
      var salImp = 0.9*salaire; var psDue=ps*bnc;
      var baseSpouse = 0.66*spouseCA;
      var RNI2 = salImp + bnc + baseSpouse;
      var irRes2 = computeTaxFromBareme(RNI2/parts, indexBar); var IR2 = irRes2.tax * parts;
      var enc2 = salaire + bnc + spouseCA; var net2 = enc2 - IR2;
      var tr2='<tr><td>'+year+'</td><td class="num">'+fmtEUR(PASS)+'</td><td class="num">'+fmtEUR(SMIC)+'</td><td>SASU-IR</td>'+
        '<td class="num">–</td><td class="num">'+fmtEUR(salaire)+'</td><td class="num">'+fmtEUR(bnc)+'</td>'+
        '<td class="num">–</td><td class="num">–</td><td>–</td>'+
        '<td class="num">'+fmtEUR(psDue)+'</td><td class="num">'+fmtEUR(RNI2)+'</td><td class="num">'+fmtEUR(IR2)+'</td><td class="num">'+fmtEUR(net2)+'</td></tr>';
      tbody.innerHTML += tr2;
      sumR+=salaire; sumB+=bnc; sumCot+=psDue; sumRNI+=RNI2; sumIR+=IR2; sumNet+=net2;
    }else{
      var salBrut = (salModeIS==='min4q') ? (600*SMIC) : sal0IS;
      var coutEmp = salBrut*(1+ratePat); var salNet = salBrut*(1-rateSal);
      var marge = CA*(1 - chargesPct/100) - chargesFix0;
      var resImp = Math.max(0, marge - coutEmp);
      var isRed = Math.min(resImp, Math.max(0,isRedThr))*0.15;
      var isNorm = Math.max(0, resImp - Math.max(0,isRedThr)) * isRate;
      var isTot = isRed + isNorm;
      var apIS = Math.max(0, resImp - isTot);
      var divBrut = apIS * distRate;
      var psDiv = 0.172 * divBrut;
      var irPFU = 0.128 * divBrut;
      var divNetPFU = divBrut - psDiv - irPFU;
      var divIRBase = 0.6 * divBrut;
      var divNetBareme = divBrut - psDiv;
      var baseSpouse = 0.66*spouseCA;
      var salImp = 0.9*salBrut;
      var RNI = salImp + baseSpouse + (divMode==='bareme'? divIRBase : 0);
      var irRes = computeTaxFromBareme(RNI/parts, indexBar); var IR = irRes.tax * parts;
      var divNet = (divMode==='pfu'? divNetPFU : divNetBareme);
      var enc = salNet + divNet + spouseCA;
      var net = enc - IR;
      var cotLike = (salBrut*ratePat) + psDiv + (divMode==='pfu'? irPFU : 0) + isTot; // charge pat + PS + (IR PFU) + IS
      var tr3='<tr><td>'+year+'</td><td class="num">'+fmtEUR(PASS)+'</td><td class="num">'+fmtEUR(SMIC)+'</td><td>SASU-IS</td>'+
        '<td class="num">'+fmtEUR(CA)+'</td><td class="num">'+fmtEUR(salBrut)+'</td><td class="num">–</td>'+
        '<td class="num">'+fmtEUR(divBrut)+'</td><td class="num">'+fmtEUR(divNet)+'</td><td>'+(divMode==='pfu'?'PFU':'Barème')+'</td>'+
        '<td class="num">'+fmtEUR(cotLike)+'</td><td class="num">'+fmtEUR(RNI)+'</td><td class="num">'+fmtEUR(IR)+'</td><td class="num">'+fmtEUR(net)+'</td></tr>';
      tbody.innerHTML += tr3;
      sumCA+=CA; sumR+=salBrut; sumDivB+=divBrut; sumDivN+=divNet; sumCot+=cotLike; sumRNI+=RNI; sumIR+=IR; sumNet+=net;
    }
  }
  document.getElementById('pCA').textContent = fmtEUR(sumCA);
  document.getElementById('pR').textContent = fmtEUR(sumR);
  document.getElementById('pBNC').textContent = fmtEUR(sumB);
  document.getElementById('pDivB').textContent = fmtEUR(sumDivB);
  document.getElementById('pDivN').textContent = fmtEUR(sumDivN);
  document.getElementById('pCot').textContent = fmtEUR(sumCot);
  document.getElementById('pRNI').textContent = fmtEUR(sumRNI);
  document.getElementById('pIR').textContent = fmtEUR(sumIR);
  document.getElementById('pNet').textContent = fmtEUR(sumNet);
}

/* EXPORT CSV */
function toCsvNumber(n, locale){ 
  if(!isFinite(n)) return '';
  var s = (Math.round(n*100)/100).toFixed(2);
  if(locale==='fr'){ s = s.replace('.', ','); }
  return s;
}
function csvEscape(text, locale){
  if(text==null) return '';
  var t = String(text);
  if(locale==='fr'){
    if(t.indexOf(';')>=0 || t.indexOf('\n')>=0 || t.indexOf('"')>=0){ t = '"' + t.replace(/"/g,'""') + '"'; }
  }else{
    if(t.indexOf(',')>=0 || t.indexOf('\n')>=0 || t.indexOf('"')>=0){ t = '"' + t.replace(/"/g,'""') + '"'; }
  }
  return t;
}
function toNumberFromEURText(t, locale){
  var s = String(t);
  s = s.replace(/\s/g,'').replace(/\u202f/g,'').replace(/[^\d\-,.]/g,'');
  s = s.replace(/\./g,'').replace(',', '.');
  var f = parseFloat(s);
  return isFinite(f)?f:0;
}
function exportCSV(){
  // Ensure latest calculations
  var mode=document.getElementById('modeSel').value;
  if(mode==='tns'){ mainCalc(false); } else if(mode==='sasuIR'){ calcSASU(false); } else { calcSISU(false); }
  calcIR();
  projectYears();

  var loc = (document.getElementById('csvLocale').value || 'fr');
  var sep = (loc==='fr' ? ';' : ',');
  function ln(a){ return a.join(sep) + "\r\n"; }

  var lines = [];
  lines.push(ln(['Simulateur TNS & IR v12.2','Date', new Date().toISOString()]));
  lines.push("\r\n");

  // Paramètres généraux
  lines.push(ln(['Paramètres généraux']));
  lines.push(ln(['Année de départ', Math.round(val('startYear'))]));
  lines.push(ln(['Nombre d\'années', Math.round(val('years'))]));
  lines.push(ln(['Inflation / index barème IR (%/an)', toCsvNumber(val('inflation'),loc)]));
  lines.push(ln(['Croissance PASS (%/an)', toCsvNumber(val('passGrow'),loc)]));
  lines.push(ln(['PASS année 1', toCsvNumber(val('pass'),loc)]));
  lines.push(ln(['SMIC horaire année 1', toCsvNumber(val('smicHour'),loc)]));
  lines.push("\r\n");

  // TNS (année 1)
  var tns = window.__TNS_state || {};
  var cot = tns.cot || {A:0, cotSansCSG:0, csg:0};
  lines.push(ln(['TNS année 1']));
  lines.push(ln(['CA', toCsvNumber(val('ca'),loc)]));
  lines.push(ln(['Charges %', toCsvNumber(val('chargesPct'),loc)]));
  lines.push(ln(['Charges fixes', toCsvNumber(val('chargesFixes'),loc)]));
  lines.push(ln(['R (rémunération)', toCsvNumber(tns.R||0,loc)]));
  lines.push(ln(['A (assiette)', toCsvNumber(cot.A||0,loc)]));
  lines.push(ln(['Cotisations hors CSG', toCsvNumber(cot.cotSansCSG||0,loc)]));
  lines.push(ln(['CSG-CRDS', toCsvNumber(cot.csg||0,loc)]));
  lines.push("\r\n");

  // SASU IR (année 1)
  var sasu = window.__SASU_state || {salaire:0, salImp:0, bnc:0, psRate:0, psDue:0};
  lines.push(ln(['SASU-IR année 1']));
  lines.push(ln(['Salaire brut', toCsvNumber(sasu.salaire,loc)]));
  lines.push(ln(['Salaire imposable (−10%)', toCsvNumber(sasu.salImp,loc)]));
  lines.push(ln(['BNC', toCsvNumber(sasu.bnc,loc)]));
  lines.push(ln(['PS (taux %)', toCsvNumber((sasu.psRate||0)*100,loc)]));
  lines.push(ln(['PS dus', toCsvNumber(sasu.psDue,loc)]));
  lines.push("\r\n");

  // SASU IS (année 1)
  var salBrut = window.__SISU_SalBrut||0;
  var divBrut = window.__SISU_DivBrut||0;
  var divNet = window.__SISU_DivNet||0;
  var isTot = window.__SISU_IS||0;
  var psDiv = window.__SISU_PS||0;
  lines.push(ln(['SASU-IS année 1']));
  lines.push(ln(['CA', toCsvNumber(val('sisuCA'),loc)]));
  lines.push(ln(['Charges %', toCsvNumber(val('sisuChargesPct'),loc)]));
  lines.push(ln(['Charges fixes', toCsvNumber(val('sisuChargesFix'),loc)]));
  lines.push(ln(['Salaire brut retenu', toCsvNumber(salBrut,loc)]));
  lines.push(ln(['Dividendes bruts', toCsvNumber(divBrut,loc)]));
  lines.push(ln(['Dividendes nets', toCsvNumber(divNet,loc)]));
  lines.push(ln(['IS total', toCsvNumber(isTot,loc)]));
  lines.push(ln(['PS sur dividendes', toCsvNumber(psDiv,loc)]));
  lines.push("\r\n");

  // IR année 1
  var ir = window.__IR_state || {parts:2, rSal:0, rBnc:0, rDivIR:0, baseSpouse:0, dedCsg:0, RNI:0, res:{slices:[],taxedBase:0,tax:0}, IR:0, net:0, mode:'tns_spouse'};
  lines.push(ln(['IR du foyer (année 1)']));
  lines.push(ln(['Parts', toCsvNumber(ir.parts,loc)]));
  lines.push(ln(['Salaire imposable', toCsvNumber(ir.rSal,loc)]));
  lines.push(ln(['BNC/Bénéfices', toCsvNumber(ir.rBnc,loc)]));
  lines.push(ln(['Dividendes (base barème après abattement)', toCsvNumber(ir.rDivIR,loc)]));
  lines.push(ln(['Base imposable conjoint', toCsvNumber(ir.baseSpouse,loc)]));
  lines.push(ln(['Déduction CSG 6,8% (TNS)', toCsvNumber(ir.dedCsg,loc)]));
  lines.push(ln(['RNI (revenu net imposable) foyer', toCsvNumber(ir.RNI,loc)]));
  lines.push(ln(['IR total', toCsvNumber(ir.IR,loc)]));
  lines.push("\r\n");

  // Projection
  lines.push(ln(['Projection pluriannuelle']));
  lines.push(ln(['Année','PASS','SMIC','Mode','CA','R/Salaire','BNC','Dividendes bruts','Dividendes nets','Mode div.','Cotis/IS/PS','RNI','IR','Net']));
  var rows = document.querySelectorAll('#tblProj tr');
  for(var r=0; r<rows.length; r++){
    var tds = rows[r].querySelectorAll('td');
    var vals = []; for(var c=0;c<tds.length;c++){ vals.push(tds[c].innerText); }
    for(var i=0;i<vals.length;i++){
      // keep 'Mode' and 'Mode div.' as text
      if(i in {3:1,9:1}) continue;
      var num = toNumberFromEURText(vals[i], loc);
      if(num!==0 || vals[i].match(/[€\d]/)){ vals[i] = toCsvNumber(num, loc); }
    }
    lines.push(ln(vals));
  }

  var csv = lines.join('');
  var blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  var ts = new Date();
  function pad(n){ return (n<10?'0':'')+n; }
  var fname = 'simulateur_v12_2_' + ts.getFullYear() + pad(ts.getMonth()+1) + pad(ts.getDate()) + '_' + pad(ts.getHours()) + pad(ts.getMinutes()) + pad(ts.getSeconds()) + (loc==='fr'?'_fr':'_intl') + '.csv';
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = fname;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
}

/* Init */
function updateAll(){ calcSASU(false); mainCalc(false); calcSISU(false); syncIR(); }
(function(){ updateAll(); showNote('howto'); })();

function detectMobileView() {
  if (window.innerWidth <= 840) {
    document.documentElement.classList.add('is-mobile');
  } else {
    document.documentElement.classList.remove('is-mobile');
  }
}
window.addEventListener('resize', detectMobileView);
detectMobileView(); // initial

function toggleViewMode(mode){
  const root = document.documentElement;
  root.classList.remove('force-mobile','force-desktop');
  if(mode === 'mobile') root.classList.add('force-mobile');
  else if(mode === 'desktop') root.classList.add('force-desktop');
  // optionnel : sauvegarde
  try { localStorage.setItem('view_mode', mode); } catch {}
}
(function(){
  const saved = (() => { try { return localStorage.getItem('view_mode'); } catch { return null; } })();
  if(saved){
    document.getElementById('viewMode').value = saved;
    toggleViewMode(saved);
  }
})();
function toggleCompact(on){
  if(on) document.documentElement.classList.add('compact');
  else document.documentElement.classList.remove('compact');
}


// Remets les principaux champs TNS/SASU à leurs valeurs d'origine et recalcule
function resetAll(){
  // valeurs par défaut (tu peux ajuster si tu les gardes ailleurs)
  document.getElementById('ca').value = 100000;
  document.getElementById('chargesPct').value = 3;
  document.getElementById('chargesFixes').value = 0;
  document.getElementById('includeCsg').value = '1';
  document.getElementById('sasuSalaire').value = 12000;
  document.getElementById('sasuBnc').value = 84000;
  document.getElementById('sisuCA').value = 150000;
  document.getElementById('sisuChargesPct').value = 3;
  document.getElementById('sisuChargesFix').value = 0;
  document.getElementById('sisuSalaire').value = 20000;
  // recalcul forcé
  updateAll();
  projectYears();
}

// Réinitialise uniquement la partie SASU à l'IR
function resetSASU(){
  document.getElementById('sasuSalaire').value = 12000;
  document.getElementById('sasuSalaireGrow').value = 0;
  document.getElementById('sasuBnc').value = 84000;
  document.getElementById('sasuBncGrow').value = 5;
  document.getElementById('psRate').value = 0.097;
  calcSASU(true);
}

// Recalcule les années de projection en fonction des inputs "Année de départ", "Nombre d'années", inflation, PASS, etc.
function updateYears(){
  // Forcer recalcul de l'année 1 puis projection
  var mode = document.getElementById('modeSel').value;
  if(mode === 'tns'){
    mainCalc(true);
  } else if(mode === 'sasuIR'){
    calcSASU(true);
  } else {
    calcSISU(true);
  }
  calcIR();
  projectYears();
}


// à la fin de script.js
window.applyTheme  = applyTheme;
window.togglePin   = togglePin;
window.switchMode  = switchMode;
window.applyRounding = applyRounding;
window.mainCalc    = mainCalc;
window.calcSASU    = calcSASU;
window.calcSISU    = calcSISU;
window.projectYears = projectYears;
window.exportCSV   = exportCSV;
window.resetAll    = resetAll;
window.resetSASU   = resetSASU;
window.updateYears = updateYears;
window.updateAll   = updateAll;
window.syncIR      = syncIR;
window.showNote    = showNote;
window.calcIR      = calcIR;
window.updateMobileHint = detectMobileView; // exposer si besoin
window.toggleCompact = toggleCompact;

