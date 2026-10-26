(() => {
  'use strict';
  const BASE = 'https://archive.org/download/dso20101212/';
  const tracks = [
    ['overture','작은 서곡','MINIATURE OVERTURE','004-tchaikovsky-nutcracker-suite-mvtI-miniature-overture',232,'#3a5565'],
    ['march','행진곡','MARCH','005-tchaikovsky-nutcracker-suite-mvtII-marche',166,'#946152'],
    ['fairy','사탕 요정의 춤','DANCE OF THE SUGAR PLUM FAIRY','006-tchaikovsky-nutcracker-suite-mvtIII-dance-sugarplum-fairy',107,'#7b708c'],
    ['russian','러시아 춤','RUSSIAN DANCE · TREPAK','007-tchaikovsky-nutcracker-suite-mvtIV-trepak',73,'#b16a50'],
    ['arabian','아라비아 춤','ARABIAN DANCE','008-tchaikovsky-nutcracker-suite-mvtV-arabian-dance',234,'#3c6970'],
    ['chinese','중국 춤','CHINESE DANCE','009-tchaikovsky-nutcracker-suite-mvtVI-chinese-dance',68,'#a78146'],
    ['flutes','갈대피리춤','DANCE OF THE REED FLUTES','010-tchaikovsky-nutcracker-suite-mvtVII-reed-flutes',144,'#6f8974'],
    ['flowers','꽃의 왈츠','WALTZ OF THE FLOWERS','011-tchaikovsky-nutcracker-suite-mvtIX-waltz-of-the-flowers',405,'#a57987']
  ].map(([id,title,en,file,duration,color]) => ({id,title,en,url:BASE+'dso20101212-'+file+'.mp3',duration,color,limit:duration>210?180:duration}));
  const $ = (s) => document.querySelector(s);
  const audio = $('#audio');
  const config = window.CLASS_CONFIG || {};
  const configured = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.scriptUrl || '');
  const room = config.room || 'music-class';
  let client = null;
  try { client=localStorage.getItem('nutcracker-client'); if(!client) {client=crypto.randomUUID();localStorage.setItem('nutcracker-client',client);} } catch (_) { /* Selection needs a durable device identity. */ }
  let state=null, lastSync=0, active=null, pending=null, busy=false, syncing=false, toastTimer, requestSequence=0;
  const cards=new Map();
  const time=(n)=>`${Math.floor(Math.max(0,n)/60)}:${String(Math.floor(Math.max(0,n)%60)).padStart(2,'0')}`;
  const notify=(message)=>{ $('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),6000); };
  tracks.forEach((t,i)=>{
    const el=document.createElement('article');el.className='card';el.style.setProperty('--art-bg',t.color);
    el.innerHTML=`<div class="art"><img src="assets/${t.id}.svg" alt="${t.title}를 표현한 삽화" loading="lazy"><span class="track-num">${String(i+1).padStart(2,'0')}</span><span class="selected-tag" hidden>✓ 선택됨</span></div><div class="card-body"><p class="track-en">${t.en}</p><h3>${t.title}</h3><p class="track-meta"><span>${time(t.limit)}</span><i class="meta-dot"></i><span>${t.duration>210?'3분 감상':'전곡 감상'}</span></p><div class="card-controls"><button class="play-button" data-audio-control aria-label="${t.title} 재생" aria-pressed="false"><span class="play-icon">▶</span><span class="play-label">재생</span></button><button class="choose-button" aria-label="${t.title} 선택" disabled>선택하기</button></div><div class="seek-row" data-audio-control><span class="elapsed">0:00</span><input type="range" min="0" max="${t.limit}" value="0" step="1" aria-label="${t.title} 재생 위치"><span>${time(t.limit)}</span></div></div>`;
    cards.set(t.id,el);$('#cards').append(el);
    el.querySelector('.play-button').addEventListener('click',()=>toggle(t));
    el.querySelector('.choose-button').addEventListener('click',()=>openChoice(t));
    el.querySelector('input').addEventListener('input',e=>{ if(active?.id!==t.id){e.target.value='0';return;} if(Number.isFinite(audio.duration)){audio.currentTime=Math.min(Number(e.target.value),audio.duration);if(audio.currentTime>=t.limit)stop();} });
  });
  function stop(){requestSequence++;audio.pause();audio.currentTime=0;if(active){const el=cards.get(active.id);el.classList.remove('is-playing');el.querySelector('.play-icon').textContent='▶';el.querySelector('.play-label').textContent='재생';el.querySelector('.play-button').setAttribute('aria-pressed','false');el.querySelector('.play-button').setAttribute('aria-label',active.title+' 재생');el.querySelector('input').value='0';el.querySelector('.elapsed').textContent='0:00';}active=null;}
  async function toggle(t){if(active?.id===t.id){stop();return;}stop();active=t;const sequence=++requestSequence;audio.src=t.url;const el=cards.get(t.id);el.classList.add('is-playing');el.querySelector('.play-label').textContent='불러오는 중';try{await audio.play();if(sequence!==requestSequence)return;el.querySelector('.play-icon').textContent='■';el.querySelector('.play-label').textContent='정지';el.querySelector('.play-button').setAttribute('aria-label',t.title+' 정지');el.querySelector('.play-button').setAttribute('aria-pressed','true');}catch(e){if(sequence!==requestSequence)return;stop();notify('음원을 불러오지 못했어요. 인터넷 연결을 확인한 뒤 재생 버튼을 다시 눌러 주세요.');}}
  audio.addEventListener('timeupdate',()=>{if(!active)return;if(audio.currentTime>=active.limit){stop();return;}const el=cards.get(active.id);el.querySelector('.elapsed').textContent=time(audio.currentTime);el.querySelector('input').value=String(audio.currentTime);});
  audio.addEventListener('ended',stop);
  audio.addEventListener('error',()=>{if(active){stop();notify('음원을 불러오지 못했어요. 잠시 후 다시 재생해 주세요.');}});
  document.addEventListener('pointerdown',e=>{if(active&&!e.target.closest('[data-audio-control]'))stop();},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else sync();});
  window.addEventListener('pagehide',stop);
  function apply(next){if(!next||typeof next.epoch!=='string'||!Number.isInteger(next.revision)||!Array.isArray(next.claims))throw new Error('서버 응답 형식이 올바르지 않습니다.');if(state&&next.revision<state.revision)return;state=next;lastSync=Date.now();render();}
  function render(){const fresh=state&&Date.now()-lastSync<25000;const mine=state?.claims.find(c=>c.client===client);tracks.forEach(t=>{const el=cards.get(t.id),claim=state?.claims.find(c=>c.song===t.id);el.classList.toggle('is-selected',!!claim);const tag=el.querySelector('.selected-tag');tag.hidden=!claim;tag.textContent=claim?.client===client?'✓ 내가 선택한 곡':'✓ 선택됨';const btn=el.querySelector('.choose-button');btn.disabled=busy||!configured||!client||!fresh||!!claim||!!mine;btn.textContent=claim?(claim.client===client?'내가 선택함':'선택됨'):mine?'선택 완료':'선택하기';});$('#selection-count').textContent=state?`${8-state.claims.length}곡 선택 가능 · 전체 8곡`:'8곡의 음악';const live=$('#sync');live.classList.toggle('offline',!fresh);live.lastChild.textContent=fresh?'선택 현황 연결됨':configured?'연결 확인 중':'감상 모드';}
  async function api(action,extra={}){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);try{const res=await fetch(config.scriptUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,room,client,...extra}),signal:controller.signal,redirect:'follow',credentials:'omit'});if(!res.ok)throw new Error('서버 연결 실패');return await res.json();}finally{clearTimeout(timeout);}}
  async function sync(){if(!configured||syncing||busy||document.hidden)return;syncing=true;try{const result=await api('state');if(!result.ok)throw new Error(result.error);apply(result.state);}catch(e){lastSync=0;render();$('#sync').lastChild.textContent='연결을 확인해 주세요';}finally{syncing=false;}}
  async function openChoice(t){if(!state||busy)return;pending=t;$('#choice-track').textContent=t.title;$('#choice-dialog').showModal();}
  $('#choice-form').addEventListener('submit',async e=>{e.preventDefault();if(busy||!pending||!state)return;const t=pending;busy=true;render();$('#confirm-choice').disabled=true;$('#confirm-choice').textContent='선택을 저장하는 중…';try{const result=await api('claim',{song:t.id,epoch:state.epoch});if(result.state)apply(result.state);if(!result.ok){notify(result.error||'선택할 수 없어요. 현황을 다시 확인해 주세요.');}else notify(`${t.title} 선택 완료! 활동지에 느낌을 적고 나만의 춤을 생각해 보세요.`);$('#choice-dialog').close();}catch(e){lastSync=0;$('#choice-dialog').close();notify('저장 결과를 확인하지 못했어요. 연결 후 선택 현황이 자동으로 확인됩니다. 같은 곡을 다시 선택해도 중복 저장되지 않아요.');}finally{busy=false;$('#confirm-choice').disabled=false;$('#confirm-choice').textContent='네, 이 곡을 선택할게요';render();sync();}});
  $('#reset').addEventListener('click',()=>{if(!configured){notify('먼저 config.js에 Apps Script 웹 앱 주소를 연결해 주세요.');return;}$('#teacher-password').value='';$('#reset-error').textContent='';$('#reset-dialog').showModal();});
  $('#reset-form').addEventListener('submit',async e=>{e.preventDefault();if(busy||!state){$('#reset-error').textContent='수업 연결을 확인한 후 다시 시도해 주세요.';return;}busy=true;render();$('#confirm-reset').disabled=true;$('#reset-error').textContent='';try{const result=await api('reset',{password:$('#teacher-password').value,epoch:state.epoch});if(result.state)apply(result.state);if(!result.ok){$('#reset-error').textContent=result.error||'초기화하지 못했습니다.';}else{$('#reset-dialog').close();notify('모든 선택을 초기화했어요. 새롭게 음악을 선택할 수 있습니다.');}}catch(e){lastSync=0;$('#reset-error').textContent='결과를 확인하지 못했습니다. 창을 닫고 연결 상태를 확인해 주세요.';}finally{busy=false;$('#teacher-password').value='';$('#confirm-reset').disabled=false;render();sync();}});
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{if(!busy)b.closest('dialog').close();}));
  document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('cancel',e=>{if(busy)e.preventDefault();});d.addEventListener('click',e=>{if(e.target===d&&!busy){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
  $('#credits-open').addEventListener('click',()=>$('#credits-dialog').showModal());
  $('#setup-notice').hidden=configured&&!!client;
  if(!client)$('#setup-notice').textContent='브라우저의 저장 공간이 차단되어 음악 감상만 할 수 있어요. 곡을 선택하려면 사이트 저장 공간을 허용해 주세요.';
  setInterval(()=>{render();sync();},Math.max(2000,Number(config.pollIntervalMs)||2000));
  window.addEventListener('online',sync);window.addEventListener('offline',()=>{lastSync=0;render();});
  render();sync();
})();
