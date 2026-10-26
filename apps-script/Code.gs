/** 호두까기 인형 수업 — Google 스프레드시트에 연결한 Apps Script에 붙여 넣으세요. */
const SONGS = [
  ['overture','작은 서곡'],['march','행진곡'],['fairy','사탕 요정의 춤'],
  ['russian','러시아 춤'],['arabian','아라비아 춤'],['chinese','중국 춤'],
  ['flutes','갈대피리춤'],['flowers','꽃의 왈츠']
];

// 처음 한 번만 편집기에서 실행하고 권한을 허용합니다.
// 프로젝트 설정 > 스크립트 속성에 TEACHER_PASSWORD를 먼저 추가하세요.
function setup() {
  const properties = PropertiesService.getScriptProperties();
  const password = properties.getProperty('TEACHER_PASSWORD');
  if (!password || password.length < 8) throw new Error('스크립트 속성 TEACHER_PASSWORD에 8자 이상의 교사 비밀번호를 설정하세요.');
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Google 스프레드시트의 확장 프로그램 > Apps Script에서 실행하세요.');
  properties.setProperty('SPREADSHEET_ID', spreadsheet.getId());
  if (!properties.getProperty('ROOM_IDS')) properties.setProperty('ROOM_IDS','music-class');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    properties.getProperty('ROOM_IDS').split(',').map(s=>s.trim()).filter(Boolean).forEach(room => loadRoom_(room));
  } finally { lock.releaseLock(); }
}

function doGet() {
  return output_({ok:true,message:'호두까기 인형 수업 서버가 준비되었습니다. 학생 페이지에서 연결하세요.'});
}

function doPost(e) {
  let lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 3000) throw new Error('올바르지 않은 요청입니다.');
    const body = JSON.parse(e.postData.contents);
    if (!['state','claim','reset'].includes(body.action)) throw new Error('올바르지 않은 요청입니다.');
    const room=String(body.room || '');
    const allowed=(PropertiesService.getScriptProperties().getProperty('ROOM_IDS') || 'music-class').split(',').map(s=>s.trim());
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(room) || !allowed.includes(room)) throw new Error('수업 이름이 일치하지 않습니다. 선생님께 알려 주세요.');
    const client=String(body.client || '');
    if (body.action!=='state' && !/^[a-zA-Z0-9_-]{16,80}$/.test(client)) throw new Error('기기 정보를 확인할 수 없습니다. 페이지를 새로 고쳐 주세요.');
    // 감상 중인 패드들의 2초 조회는 캐시를 읽어 스프레드시트 호출을 줄입니다.
    if(body.action==='state') {
      const cached=CacheService.getScriptCache().get('room-state:'+room);
      if(cached) return output_({ok:true,state:JSON.parse(cached)});
    }
    lock=LockService.getScriptLock();
    if (!lock.tryLock(15000)) throw new Error('친구의 선택을 저장하는 중입니다. 잠시 후 다시 시도해 주세요.');
    const {sheet,state}=loadRoom_(room);
    if (body.action==='state') {
      CacheService.getScriptCache().put('room-state:'+room,JSON.stringify(state),60);
      return output_({ok:true,state});
    }
    if (body.action==='reset') {
      const expected=PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD');
      const cache=CacheService.getScriptCache();
      const attempts=Number(cache.get('reset-attempts') || 0);
      if (attempts>=10) return output_({ok:false,error:'비밀번호 확인을 여러 번 실패했습니다. 5분 후 다시 시도하세요.'});
      if (!expected || !equal_(String(body.password || ''),expected)) {
        cache.put('reset-attempts',String(attempts+1),300);
        return output_({ok:false,error:'교사 비밀번호가 올바르지 않습니다.'});
      }
      cache.remove('reset-attempts');
      if(body.epoch!==state.epoch) return output_({ok:false,error:'이미 수업이 초기화되었습니다. 현재 현황을 확인해 주세요.',state});
      state.epoch=Utilities.getUuid();state.revision++;state.claims=[];
      saveRoom_(sheet,room,state);
      return output_({ok:true,state});
    }
    if(body.epoch!==state.epoch) return output_({ok:false,error:'새 수업이 시작되었어요. 현황을 확인하고 다시 선택해 주세요.',state});
    if(!SONGS.some(s=>s[0]===body.song)) throw new Error('등록되지 않은 곡입니다.');
    const mine=state.claims.find(c=>c.client===client);
    if(mine) return output_({ok:mine.song===body.song,error:mine.song===body.song?null:'이미 한 곡을 선택했어요. 선택은 바꿀 수 없어요.',state});
    if(state.claims.some(c=>c.song===body.song)) return output_({ok:false,error:'친구가 먼저 이 곡을 선택했어요. 다른 곡을 골라 주세요.',state});
    state.claims.push({song:body.song,client,at:new Date().toISOString()});state.revision++;
    saveRoom_(sheet,room,state);
    return output_({ok:true,state});
  } catch(error) {
    console.error(error);
    const message=String(error.message || '');
    return output_({ok:false,error: /요청|수업 이름|기기 정보|친구의 선택|등록되지/.test(message)?message:'수업 서버를 확인해 주세요. 선생님이 setup 실행과 스크립트 속성을 확인해야 합니다.'});
  } finally { if(lock && lock.hasLock()) lock.releaseLock(); }
}

function loadRoom_(room) {
  const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!id) throw new Error('setup을 먼저 실행하세요.');
  const book=SpreadsheetApp.openById(id);
  const name='선택_'+room;
  let sheet=book.getSheetByName(name);
  if(!sheet){sheet=book.insertSheet(name);const state={epoch:Utilities.getUuid(),revision:0,claims:[]};saveRoom_(sheet,room,state);sheet.setFrozenRows(2);sheet.autoResizeColumns(1,4);return {sheet,state};}
  const rows=sheet.getRange(1,1,10,4).getValues();
  if(!rows[0][2] || rows[0][0]!=='수업') throw new Error('시트가 손상되었습니다.');
  const state={epoch:String(rows[0][2]),revision:Number(rows[0][3]),claims:rows.slice(2).filter(r=>r[2]).map(r=>({song:String(r[0]),client:String(r[2]),at:String(r[3])}))};
  return {sheet,state};
}

function saveRoom_(sheet,room,state) {
  const rows=[['수업',room,state.epoch,state.revision],['곡 ID','곡 제목','선택 기기 식별자','선택 시각 (UTC)']];
  SONGS.forEach(([id,title])=>{const claim=state.claims.find(c=>c.song===id);rows.push([id,title,claim?claim.client:'',claim?claim.at:'']);});
  sheet.getRange(1,1,10,4).setValues(rows);
  SpreadsheetApp.flush();
  CacheService.getScriptCache().put('room-state:'+room,JSON.stringify(state),60);
}

function equal_(a,b) {
  const hash=s=>Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8);
  const aa=hash(a),bb=hash(b);let diff=0;for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0;
}
function output_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
