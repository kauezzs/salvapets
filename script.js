'use strict';
/* SalvaPets — dados em localStorage (camada Store isolada para troca futura por API/backend) */
const KEY = 'salvapets:v1', SKEY = 'salvapets:session';
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => Array.from(e.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const today = () => new Date().toLocaleDateString('pt-BR');
const hhmm = iso => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

/* ---------- Fotos ----------
   As duas fotos reais ficam embutidas no index.html (seção inicial). Capturamos
   antes do primeiro render e reaproveitamos nos cards. Os demais animais usam
   uma ilustração em SVG gerada aqui, sem arquivos externos. */
const PHOTOS = (() => {
  const im = $$('.collage img');
  return { dog: im[0] ? im[0].src : '', cat: im[1] ? im[1].src : '' };
})();
const LANDING = $('#app') ? $('#app').innerHTML : '';

function svgPic(emoji, bg) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='${bg}'/><text x='100' y='132' font-size='96' text-anchor='middle'>${emoji}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
const BGS = ['#f4ece2', '#eaefe3', '#e8dfd4', '#f1e4d3', '#e6ece8'];
function petImg(a) {
  if (a.photo && a.photo.startsWith('data:')) return a.photo;
  if (a.photo === 'dog' && PHOTOS.dog) return PHOTOS.dog;
  if (a.photo === 'cat' && PHOTOS.cat) return PHOTOS.cat;
  const h = [...String(a.id)].reduce((n, c) => n + c.charCodeAt(0), 0);
  return svgPic(a.species === 'Gato' ? '🐱' : '🐶', BGS[h % BGS.length]);
}
const userImg = u => svgPic(u.role === 'ong' ? '🏠' : '🙂', '#f4ece2');

/* ---------- Store ---------- */
const Store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } },
  load() {
    try { const d = JSON.parse(this.get(KEY)); return d && d.users && d.animals && d.requests && d.messages ? d : null; }
    catch (e) { return null; }
  },
  save(d) {
    const ok = this.set(KEY, JSON.stringify(d));
    if (!ok) toast('Não foi possível salvar: armazenamento cheio ou bloqueado.');
    return ok;
  }
};

function seed() {
  const now = new Date().toISOString();
  const d = {
    users: [
      { id: 'u1', role: 'vol', name: 'Mariana Souza', email: 'mariana@email.com', pass: '12345678', phone: '(51) 99999-1111', city: 'Porto Alegre, RS', home: 'Apartamento', bio: 'Moro com minha família e quero ajudar bichinhos a se recuperarem.' },
      { id: 'u2', role: 'ong', name: 'Patas Amigas', org: 'Patas Amigas', resp: 'Carla Mendes', email: 'contato@patasamigas.org.br', pass: '12345678', phone: '(51) 3333-2222', city: 'Porto Alegre, RS', bio: 'Resgatamos e cuidamos de cães e gatos até encontrarem um lar.' }
    ],
    animals: [
      { id: 'a1', ongId: 'u2', name: 'Luna', species: 'Cachorro', age: '2 anos', size: 'Médio', city: 'Porto Alegre, RS', status: 'Disponível', photo: 'dog', desc: 'Dócil, brincalhona e muito carinhosa. Ótima com crianças e outros cães. Precisa de um lar temporário até a adoção.' },
      { id: 'a2', ongId: 'u2', name: 'Mel', species: 'Gato', age: '1 ano', size: 'Pequeno', city: 'Canoas, RS', status: 'Disponível', photo: 'cat', desc: 'Gata calma, gosta de colo e de janelas ensolaradas. Já é castrada e vacinada.' },
      { id: 'a3', ongId: 'u2', name: 'Thor', species: 'Cachorro', age: '4 anos', size: 'Grande', city: 'Porto Alegre, RS', status: 'Disponível', photo: '', desc: 'Grandalhão e tranquilo. Anda bem na guia e precisa de espaço para se exercitar.' },
      { id: 'a4', ongId: 'u2', name: 'Nina', species: 'Gato', age: '6 meses', size: 'Pequeno', city: 'Novo Hamburgo, RS', status: 'Disponível', photo: '', desc: 'Filhote curiosa e cheia de energia. Está em fase de socialização.' },
      { id: 'a5', ongId: 'u2', name: 'Bento', species: 'Cachorro', age: '8 anos', size: 'Pequeno', city: 'Sapiranga, RS', status: 'Disponível', photo: '', desc: 'Senhorzinho sereno que só quer um canto quentinho e atenção.' },
      { id: 'a6', ongId: 'u2', name: 'Pipoca', species: 'Gato', age: '3 anos', size: 'Médio', city: 'Porto Alegre, RS', status: 'Em lar temporário', photo: '', desc: 'Já está em lar temporário e se adaptando muito bem.' }
    ],
    requests: [
      { id: 'r1', animalId: 'a2', volId: 'u1', status: 'Pendente', date: today(), home: 'Apartamento', msg: 'Tenho experiência com gatos e quero acolher a Mel por alguns meses.' }
    ],
    messages: [
      { id: 'm1', reqId: 'r1', from: 'u1', text: 'Olá! Tenho interesse em acolher a Mel. Podemos conversar?', ts: now },
      { id: 'm2', reqId: 'r1', from: 'u2', text: 'Oi, Mariana! Obrigada pelo interesse. Vamos analisar sua solicitação com carinho.', ts: now }
    ]
  };
  Store.save(d);
  return d;
}

let DB = Store.load() || seed();
let SESSION = Store.get(SKEY);
const UI = { conv: null, photo: null, lastFocus: null };
const save = () => Store.save(DB);
const user = id => DB.users.find(u => u.id === id);
const animal = id => DB.animals.find(a => a.id === id);
const curUser = () => (SESSION ? user(SESSION) : null) || null;
function setSession(id) { SESSION = id; if (id) Store.set(SKEY, id); else Store.del(SKEY); }

/* ---------- Utilidades de UI ---------- */
const ICON = {
  home: 'M3 11 12 3l9 8v10h-6v-7H9v7H3z',
  heart: 'M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z',
  file: 'M6 3h9l4 4v14H6zM14 3v5h5',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  out: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  menu: 'M4 6h16M4 12h16M4 18h16',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  plus: 'M12 5v14M5 12h14'
};
const ico = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[n]}"></path></svg>`;

let toastT;
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
}

function go(h) { if (location.hash === h) route(); else location.hash = h; }

const stClass = s => ({ 'Pendente': 'warn', 'Recusada': 'bad', 'Cancelada': 'mut', 'Em lar temporário': 'warn', 'Adotado': 'mut' }[s] || '');
const badge = s => `<span class="st ${stClass(s)}">${esc(s)}</span>`;

function fld(id, label, type, val, extra = '') {
  return `<div class="fld"><label for="f-${id}">${label}</label><input class="in" id="f-${id}" name="${id}" type="${type}" value="${esc(val)}" ${extra}></div>`;
}
function sel(id, label, opts, val) {
  return `<div class="fld"><label for="f-${id}">${label}</label><select class="in" id="f-${id}" name="${id}">${opts.map(o => `<option${o === val ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
}
function txt(id, label, val, extra = '') {
  return `<div class="fld"><label for="f-${id}">${label}</label><textarea class="in" id="f-${id}" name="${id}" ${extra}>${esc(val)}</textarea></div>`;
}
function fieldErr(form, name, msg) {
  const i = form.elements[name]; if (!i) return;
  i.classList.add('err'); i.setAttribute('aria-invalid', 'true');
  const box = i.parentElement;
  let em = $('.em', box);
  if (!em) { em = document.createElement('span'); em.className = 'em'; em.setAttribute('role', 'alert'); box.appendChild(em); }
  em.textContent = msg;
}
function clearErrs(form) {
  $$('.err', form).forEach(i => { i.classList.remove('err'); i.removeAttribute('aria-invalid'); });
  $$('.em', form).forEach(n => n.remove());
}
function formErr(form, msg) {
  let em = $('.form-err', form);
  if (!em) { em = document.createElement('p'); em.className = 'em form-err'; em.setAttribute('role', 'alert'); form.insertBefore(em, form.firstChild); }
  em.textContent = msg;
}

/* ---------- Modal ---------- */
function openModal(html) {
  const m = $('#modal'); UI.lastFocus = document.activeElement;
  m.innerHTML = `<div class="mb" role="dialog" aria-modal="true" aria-label="Janela">${html}</div>`;
  m.hidden = false;
  const f = $('input,select,textarea,button', m); if (f) f.focus();
}
function closeModal(silent) {
  const m = $('#modal'); if (!m || m.hidden) return;
  m.hidden = true; m.innerHTML = '';
  if (!silent && UI.lastFocus && UI.lastFocus.focus) UI.lastFocus.focus();
}
function confirmBox(text, act, id) {
  openModal(`<h2>Tem certeza?</h2><p class="muted">${esc(text)}</p><div class="acts"><button class="btn" data-act="close" type="button">Cancelar</button><button class="btn p" data-act="${act}" data-id="${esc(id)}" type="button">Confirmar</button></div>`);
}

/* ---------- Roteador ---------- */
const PUBLIC = ['/', '/login', '/cadastro-voluntario', '/cadastro-ong'];
const AUTH = ['/login', '/cadastro-voluntario', '/cadastro-ong'];
const TITLES = { '/painel': 'Início', '/animais': 'Animais', '/solicitacoes': 'Solicitações', '/mensagens': 'Mensagens', '/perfil': 'Perfil' };

function route() {
  closeModal(true);
  const path = ((location.hash || '#/').replace(/^#/, '').split('?')[0]) || '/';
  const u = curUser();
  if (SESSION && !u) setSession(null);
  if (!u && !PUBLIC.includes(path)) return go('#/login');
  if (u && AUTH.includes(path)) return go('#/painel');

  const app = $('#app');
  let first = false;
  if (path === '/') { app.innerHTML = LANDING; patchLanding(u); document.title = 'SalvaPets — Um lar muda tudo'; }
  else if (path === '/login') { app.innerHTML = viewLogin(); document.title = 'Entrar — SalvaPets'; first = true; }
  else if (path === '/cadastro-voluntario') { app.innerHTML = viewSignup('vol'); document.title = 'Cadastro de voluntário — SalvaPets'; first = true; }
  else if (path === '/cadastro-ong') { app.innerHTML = viewSignup('ong'); document.title = 'Cadastro de ONG — SalvaPets'; first = true; }
  else if (TITLES[path]) {
    const views = { '/painel': viewHome, '/animais': viewAnimals, '/solicitacoes': viewRequests, '/mensagens': viewChat, '/perfil': viewProfile };
    app.innerHTML = shell(u, path, views[path](u));
    document.title = TITLES[path] + ' — SalvaPets';
    if (path === '/mensagens') scrollMsgs();
    first = true;
  } else return go(u ? '#/painel' : '#/');

  window.scrollTo(0, 0);
  if (first) { const c = $('#conteudo'); if (c) c.focus({ preventScroll: true }); }
}

function patchLanding(u) {
  if (!u) return;
  const nav = $('.top nav'); if (!nav) return;
  nav.innerHTML = `<button class="btn sm" data-act="scroll" type="button">Como funciona</button><button class="btn sm p" data-go="#/painel" type="button">Meu painel</button><button class="btn sm" data-act="logout" type="button">Sair</button>`;
  $$('.hero .acts .btn').forEach(b => { b.dataset.go = '#/painel'; });
}

/* ---------- Telas públicas ---------- */
function topbar() {
  return `<header class="top"><div class="l"><a class="logo" href="#/">SalvaPets</a><span class="tag">Um lar muda tudo.</span></div><nav aria-label="Navegação"><button class="btn sm" data-go="#/" type="button">Voltar ao início</button></nav></header>`;
}
function authSide(img, title, text) {
  return `<aside class="side"><img src="${img}" alt="${esc(title)}"><div class="cardq"><h2>${esc(title)}</h2><p>${esc(text)}</p></div></aside>`;
}

function viewLogin() {
  return `<div class="wrap">${topbar()}<main id="conteudo" tabindex="-1"><div class="auth">
    <div class="form">
      <span class="eyebrow">Bem-vindo de volta</span>
      <h1>Entre na sua conta</h1>
      <p class="sub">Acompanhe solicitações, mensagens e os animais que você ajuda.</p>
      <form data-form="login" novalidate>
        ${fld('email', 'E-mail', 'email', '', 'autocomplete="email" placeholder="voce@email.com"')}
        ${fld('pass', 'Senha', 'password', '', 'autocomplete="current-password" placeholder="Sua senha"')}
        <button class="btn p block" type="submit">Entrar ${ico('arrow')}</button>
      </form>
      <div class="box"><h3>Contas para testar</h3>
        <p class="muted">Voluntária: mariana@email.com · 12345678<br>ONG: contato@patasamigas.org.br · 12345678</p>
      </div>
      <p class="safe">Ainda não tem conta? <a href="#/cadastro-voluntario"><b>Quero acolher</b></a> ou <a href="#/cadastro-ong"><b>Sou uma ONG</b></a>.</p>
    </div>
    ${authSide(PHOTOS.dog || svgPic('🐶', '#f4ece2'), 'Cada lar temporário conta.', 'Entre para acompanhar quem está esperando por você.')}
  </div></main></div>`;
}

function viewSignup(role) {
  const vol = role === 'vol';
  return `<div class="wrap">${topbar()}<main id="conteudo" tabindex="-1"><div class="auth">
    <div class="form">
      <span class="eyebrow">${vol ? 'Quero acolher' : 'Sou uma ONG'}</span>
      <h1>${vol ? 'Crie sua conta de voluntário' : 'Cadastre sua ONG'}</h1>
      <p class="sub">${vol ? 'Leva menos de um minuto. Sem compromisso de adoção.' : 'Publique seus animais e encontre lares temporários.'}</p>
      <div class="tabs2" role="group" aria-label="Tipo de conta">
        <button class="btn${vol ? ' on' : ''}" data-go="#/cadastro-voluntario" type="button">Voluntário</button>
        <button class="btn${vol ? '' : ' on'}" data-go="#/cadastro-ong" type="button">ONG</button>
      </div>
      <form data-form="signup" data-role="${role}" novalidate>
        ${vol ? fld('name', 'Nome completo', 'text', '', 'autocomplete="name"') : fld('org', 'Nome da ONG', 'text', '') + fld('resp', 'Responsável', 'text', '', 'autocomplete="name"')}
        ${fld('email', 'E-mail', 'email', '', 'autocomplete="email"')}
        <div class="f2">${fld('phone', 'Telefone', 'tel', '', 'autocomplete="tel" placeholder="(51) 99999-0000"')}${fld('city', 'Cidade', 'text', '', 'placeholder="Porto Alegre, RS"')}</div>
        ${vol ? sel('home', 'Onde você mora?', ['Casa com quintal', 'Casa sem quintal', 'Apartamento'], 'Casa com quintal') : ''}
        <div class="f2">${fld('pass', 'Senha (mín. 8 caracteres)', 'password', '', 'autocomplete="new-password"')}${fld('pass2', 'Confirmar senha', 'password', '', 'autocomplete="new-password"')}</div>
        <div class="fld"><label class="chk" for="f-terms"><input type="checkbox" id="f-terms" name="terms"> Concordo com os termos de uso e com a política de privacidade.</label></div>
        <button class="btn p block" type="submit">Criar conta ${ico('arrow')}</button>
      </form>
      <p class="safe">Já tem conta? <a href="#/login"><b>Entrar</b></a></p>
    </div>
    ${authSide(vol ? (PHOTOS.cat || svgPic('🐱', '#eaefe3')) : (PHOTOS.dog || svgPic('🐶', '#f4ece2')), vol ? 'Um cantinho em casa muda uma vida.' : 'Mais lares para quem você cuida.', vol ? 'Acolha com orientação em cada etapa.' : 'Conecte seus animais a voluntários da sua região.')}
  </div></main></div>`;
}

/* ---------- Painel (shell) ---------- */
function shell(u, path, body) {
  const ong = u.role === 'ong';
  const nav = [
    ['/painel', 'home', 'Início'],
    ['/animais', 'heart', ong ? 'Meus animais' : 'Animais'],
    ['/solicitacoes', 'file', 'Solicitações'],
    ['/mensagens', 'chat', 'Mensagens'],
    ['/perfil', 'user', 'Perfil']
  ];
  const alert = ong ? myRequests(u).some(r => r.status === 'Pendente') : myRequests(u).some(r => r.status === 'Aprovada');
  return `<div class="panel">
    <aside class="side-n" id="sidenav" aria-label="Menu lateral">
      <a class="logo" href="#/painel">SalvaPets</a><div class="slogan">UM LAR MUDA TUDO.</div>
      <nav aria-label="Principal">${nav.map(n => `<a href="#${n[0]}"${n[0] === path ? ' class="on" aria-current="page"' : ''}>${ico(n[1])} ${n[2]}</a>`).join('')}</nav>
      <div class="bot"><div class="box"><h3>Precisa de ajuda?</h3><p>Fale com a gente: ajuda@salvapets.org</p></div>
      <button class="out" data-act="logout" type="button">${ico('out')} Sair</button></div>
    </aside>
    <div class="scrim" data-act="menu"></div>
    <div class="main">
      <header class="bar">
        <button class="menu-b" data-act="menu" type="button" aria-label="Abrir menu" aria-controls="sidenav">${ico('menu')}</button>
        <div><small>${ong ? 'Painel da ONG' : 'Painel do voluntário'}</small><b>${TITLES[path]}</b></div>
        <div class="u"><button class="bell" data-go="#/solicitacoes" type="button" aria-label="${alert ? 'Há novidades nas solicitações' : 'Solicitações'}">${ico('bell')}${alert ? '<i></i>' : ''}</button>
          <img class="avatar" src="${userImg(u)}" alt="Foto de perfil de ${esc(u.name)}"><div><b>${esc(u.name)}</b><span>${ong ? 'ONG' : 'Voluntário'}</span></div></div>
      </header>
      <main id="conteudo" tabindex="-1" class="content">${body}</main>
    </div>
  </div>`;
}

function myRequests(u) {
  return DB.requests.filter(r => {
    const a = animal(r.animalId);
    return u.role === 'ong' ? a && a.ongId === u.id : r.volId === u.id;
  }).reverse();
}

/* ---------- Telas do painel ---------- */
function petCard(a) {
  const ong = user(a.ongId);
  return `<button class="pet" type="button" data-act="open" data-id="${a.id}" style="width:100%">
    <img src="${petImg(a)}" alt="Foto de ${esc(a.name)}, ${a.species === 'Gato' ? 'gato' : 'cachorro'}" loading="lazy">
    <div><b>${esc(a.name)}</b><span class="muted">${esc(a.species)} · ${esc(a.age)} · ${esc(a.size)}</span>
    <small>${esc(ong ? ong.org || ong.name : '')} · ${esc(a.city)}</small><small>${badge(a.status)}</small></div></button>`;
}

function viewHome(u) {
  const first = u.name.split(' ')[0];
  const reqs = myRequests(u);
  if (u.role === 'ong') {
    const mine = DB.animals.filter(a => a.ongId === u.id);
    const rec = reqs.slice(0, 5);
    return `<div class="banner"><div><span class="eyebrow">Painel da ONG</span><h2>Olá, ${esc(first)}!</h2><p>Gerencie seus animais e acompanhe quem quer acolher.</p>
      <button class="btn p" data-act="newpet" type="button">${ico('plus')} Cadastrar animal</button></div><img src="${PHOTOS.cat || svgPic('🐱', '#f4ece2')}" alt="Gato de bigodes brancos"></div>
      <div class="stats s4 cream"><div class="stat"><b>${mine.length}</b><span>Animais cadastrados</span></div>
      <div class="stat"><b>${mine.filter(a => a.status === 'Disponível').length}</b><span>Disponíveis</span></div>
      <div class="stat"><b>${reqs.filter(r => r.status === 'Pendente').length}</b><span>Solicitações pendentes</span></div>
      <div class="stat"><b>${mine.filter(a => a.status === 'Em lar temporário').length}</b><span>Em lar temporário</span></div></div>
      <div class="row"><h2 class="sec">Solicitações recentes</h2><button class="btn sm" data-go="#/solicitacoes" type="button">Ver todas</button></div>
      ${rec.length ? reqTable(rec) : '<div class="empty">Nenhuma solicitação ainda.</div>'}`;
  }
  const pets = DB.animals.filter(a => a.status === 'Disponível').slice(0, 3);
  return `<div class="banner"><div><span class="eyebrow">Painel do voluntário</span><h2>Olá, ${esc(first)}!</h2><p>Há animais esperando por um lar temporário perto de você.</p>
    <button class="btn p" data-go="#/animais" type="button">Ver animais ${ico('arrow')}</button></div><img src="${PHOTOS.dog || svgPic('🐶', '#f4ece2')}" alt="Cachorro com uma tulipa na boca"></div>
    <div class="stats cream"><div class="stat"><b>${reqs.length}</b><span>Solicitações enviadas</span></div>
    <div class="stat"><b>${reqs.filter(r => r.status === 'Aprovada').length}</b><span>Aprovadas</span></div>
    <div class="stat"><b>${reqs.filter(r => r.status === 'Pendente').length}</b><span>Em análise</span></div></div>
    <div class="row"><h2 class="sec">Animais que precisam de você</h2><button class="btn sm" data-go="#/animais" type="button">Ver todos</button></div>
    ${pets.length ? `<div class="grid3">${pets.map(petCard).join('')}</div>` : '<div class="empty">Nenhum animal disponível no momento.</div>'}`;
}

function viewAnimals(u) {
  if (u.role === 'ong') {
    const mine = DB.animals.filter(a => a.ongId === u.id);
    return `<div class="hd"><div><h1>Meus animais</h1><p class="sub">Cadastre, edite e acompanhe o status de cada animal.</p></div>
      <button class="btn p" data-act="newpet" type="button">${ico('plus')} Cadastrar animal</button></div>
      ${mine.length ? mine.map(a => `<article class="long s"><img src="${petImg(a)}" alt="Foto de ${esc(a.name)}">
        <div class="g"><h3>${esc(a.name)}</h3><span class="muted">${esc(a.species)} · ${esc(a.age)} · ${esc(a.size)} · ${esc(a.city)}</span><div style="margin-top:8px">${badge(a.status)}</div></div>
        <div class="acts2"><button class="btn sm" data-act="editpet" data-id="${a.id}" type="button">Editar</button>
        <button class="btn sm" data-act="delpet" data-id="${a.id}" type="button" aria-label="Excluir ${esc(a.name)}">Excluir</button></div></article>`).join('') : '<div class="empty">Você ainda não cadastrou animais.</div>'}`;
  }
  return `<h1>Animais</h1><p class="sub">Encontre quem precisa de um lar temporário.</p>
    <div class="filters" role="search">
      <div class="fld"><label for="q">Buscar</label><input class="in" id="q" data-flt type="search" placeholder="Nome, cidade ou descrição"></div>
      <div class="fld"><label for="fsp">Espécie</label><select class="in" id="fsp" data-flt><option value="">Todas</option><option>Cachorro</option><option>Gato</option></select></div>
      <div class="fld"><label for="fsz">Porte</label><select class="in" id="fsz" data-flt><option value="">Todos</option><option>Pequeno</option><option>Médio</option><option>Grande</option></select></div>
      <button class="btn" data-act="clearflt" type="button">Limpar filtros</button></div>
    <div class="count" aria-live="polite"><span id="count"></span></div><div id="petgrid" class="grid3">${petsHTML()}</div>`;
}
function filteredPets() {
  const q = ($('#q') ? $('#q').value : '').trim().toLowerCase();
  const sp = $('#fsp') ? $('#fsp').value : '', sz = $('#fsz') ? $('#fsz').value : '';
  return DB.animals.filter(a => a.status !== 'Adotado' && (!sp || a.species === sp) && (!sz || a.size === sz) &&
    (!q || [a.name, a.city, a.desc, a.species].join(' ').toLowerCase().includes(q)));
}
function petsHTML() {
  const l = filteredPets();
  return l.length ? l.map(petCard).join('') : '<div class="empty" style="grid-column:1/-1">Nenhum animal encontrado com esses filtros.</div>';
}
function renderPets() {
  const g = $('#petgrid'); if (!g) return;
  g.innerHTML = petsHTML();
  const n = filteredPets().length;
  $('#count').textContent = n + (n === 1 ? ' animal encontrado' : ' animais encontrados');
}

function reqTable(list) {
  return `<div class="tbl" role="table" aria-label="Solicitações recebidas">
    <div class="r h" role="row"><span role="columnheader">Voluntário</span><span role="columnheader">Animal</span><span role="columnheader">Data</span><span role="columnheader">Status</span><span role="columnheader">Ações</span></div>
    ${list.map(r => {
      const a = animal(r.animalId), v = user(r.volId);
      return `<div class="r" role="row"><span class="p" role="cell"><img src="${userImg(v)}" alt="">${esc(v.name)}</span>
        <span role="cell">${esc(a.name)}</span><span role="cell">${esc(r.date)}</span><span role="cell">${badge(r.status)}</span>
        <span role="cell" class="acts2">${r.status === 'Pendente' ? `<button class="btn sm p" data-act="approve" data-id="${r.id}" type="button">Aprovar</button><button class="btn sm" data-act="refuse" data-id="${r.id}" type="button">Recusar</button>` : ''}
        <button class="btn sm" data-act="chat" data-id="${r.id}" type="button">Mensagem</button></span></div>`;
    }).join('')}</div>`;
}

function viewRequests(u) {
  const list = myRequests(u);
  if (u.role === 'ong') {
    return `<h1>Solicitações</h1><p class="sub">Analise os pedidos de lar temporário para seus animais.</p>
      ${list.length ? reqTable(list) : '<div class="empty">Nenhuma solicitação recebida ainda.</div>'}`;
  }
  return `<h1>Minhas solicitações</h1><p class="sub">Acompanhe o andamento dos seus pedidos.</p>
    ${list.length ? list.map(r => {
      const a = animal(r.animalId);
      return `<article class="long s"><img src="${petImg(a)}" alt="Foto de ${esc(a.name)}">
        <div class="g"><h3>${esc(a.name)}</h3><span class="muted">Enviada em ${esc(r.date)} · ${esc(a.species)} · ${esc(a.city)}</span><div style="margin-top:8px">${badge(r.status)}</div></div>
        <div class="acts2"><button class="btn sm" data-act="chat" data-id="${r.id}" type="button">Mensagem</button>
        ${r.status === 'Pendente' ? `<button class="btn sm" data-act="cancelreq" data-id="${r.id}" type="button">Cancelar</button>` : ''}</div></article>`;
    }).join('') : `<div class="empty">Você ainda não enviou solicitações.<br><br><button class="btn p" data-go="#/animais" type="button">Ver animais</button></div>`}`;
}

function convList(u) { return myRequests(u).filter(r => animal(r.animalId)); }
function viewChat(u) {
  const list = convList(u);
  if (!list.length) return `<h1>Mensagens</h1><p class="sub">Converse com a ${u.role === 'ong' ? 'pessoa voluntária' : 'ONG'} sobre cada solicitação.</p><div class="empty">Nenhuma conversa ainda. Envie uma solicitação para começar.</div>`;
  if (!UI.conv || !list.some(r => r.id === UI.conv)) UI.conv = list[0].id;
  return `<h1>Mensagens</h1><p class="sub">Converse sobre cada solicitação.</p>
    <div class="chat"><div class="list" role="list" aria-label="Conversas">${list.map(r => convItem(r, u)).join('')}</div><div class="main2" id="chatpane">${chatPane(u)}</div></div>`;
}
function other(r, u) { return u.role === 'ong' ? user(r.volId) : user(animal(r.animalId).ongId); }
function convItem(r, u) {
  const a = animal(r.animalId), o = other(r, u);
  return `<button class="conv" role="listitem" data-act="selconv" data-id="${r.id}" type="button" style="margin-bottom:10px;${r.id === UI.conv ? 'outline:2px solid var(--brown)' : ''}" ${r.id === UI.conv ? 'aria-current="true"' : ''}>
    <img src="${petImg(a)}" alt=""><span><b>${esc(o.org || o.name)}</b><small>${esc(a.name)}</small></span></button>`;
}
function chatPane(u) {
  const r = DB.requests.find(x => x.id === UI.conv); if (!r) return '';
  const a = animal(r.animalId), o = other(r, u);
  const ms = DB.messages.filter(m => m.reqId === r.id);
  return `<div class="head"><img src="${petImg(a)}" alt=""><div><b>${esc(o.org || o.name)}</b><small class="muted" style="display:block">Sobre ${esc(a.name)} · ${badge(r.status)}</small></div></div>
    <div class="msgs" id="msgs" role="log" aria-live="polite">${ms.length ? `<div class="day">${esc(new Date(ms[0].ts).toLocaleDateString('pt-BR'))}</div>` : ''}
    ${ms.map(m => `<div class="m${m.from === u.id ? ' me' : ''}"><p>${esc(m.text)}</p><small>${hhmm(m.ts)}</small></div>`).join('')}</div>
    <form class="send" data-form="send" novalidate><input id="f-text" name="text" type="text" placeholder="Escreva uma mensagem" autocomplete="off" aria-label="Escreva uma mensagem"><button class="btn p" type="submit">Enviar</button></form>`;
}
function scrollMsgs() { const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; }

function viewProfile(u) {
  const ong = u.role === 'ong';
  const reqs = myRequests(u);
  return `<h1>Meu perfil</h1><p class="sub">Mantenha seus dados atualizados.</p>
    <div class="prof"><div class="white c"><img src="${userImg(u)}" alt="Foto de perfil de ${esc(u.name)}"><h3>${esc(ong ? u.org : u.name)}</h3><p class="l">${esc(u.email)}</p>
      <ul><li>${ong ? DB.animals.filter(a => a.ongId === u.id).length + ' animais cadastrados' : reqs.length + ' solicitações enviadas'}</li><li>${esc(u.city || 'Cidade não informada')}</li></ul></div>
    <div class="white"><h2>Dados da conta</h2>
      <form data-form="profile" novalidate>
        ${ong ? fld('org', 'Nome da ONG', 'text', u.org) + fld('resp', 'Responsável', 'text', u.resp || '') : fld('name', 'Nome completo', 'text', u.name)}
        <div class="f2">${fld('phone', 'Telefone', 'tel', u.phone || '')}${fld('city', 'Cidade', 'text', u.city || '')}</div>
        ${ong ? '' : sel('home', 'Onde você mora?', ['Casa com quintal', 'Casa sem quintal', 'Apartamento'], u.home || 'Casa com quintal')}
        ${txt('bio', 'Sobre você', u.bio || '', 'rows="3"')}
        <button class="btn p" type="submit">Salvar alterações</button>
      </form></div></div>`;
}

/* ---------- Modais de animal ---------- */
function showAnimal(id) {
  const a = animal(id), u = curUser(); if (!a || !u) return;
  const ong = user(a.ongId);
  let action = '';
  if (u.role === 'vol') {
    const ex = DB.requests.find(r => r.animalId === a.id && r.volId === u.id && (r.status === 'Pendente' || r.status === 'Aprovada'));
    if (ex) action = `<div class="ok">Você já enviou uma solicitação (${esc(ex.status.toLowerCase())}).</div><div class="acts"><button class="btn" data-act="close" type="button">Fechar</button><button class="btn p" data-act="chat" data-id="${ex.id}" type="button">Abrir mensagens</button></div>`;
    else if (a.status !== 'Disponível') action = `<div class="empty">Este animal já está em lar temporário.</div><div class="acts"><button class="btn" data-act="close" type="button">Fechar</button></div>`;
    else action = `<div class="acts"><button class="btn" data-act="close" type="button">Fechar</button><button class="btn p" data-act="request" data-id="${a.id}" type="button">Quero acolher</button></div>`;
  } else if (a.ongId === u.id) {
    action = `<div class="acts"><button class="btn" data-act="close" type="button">Fechar</button><button class="btn p" data-act="editpet" data-id="${a.id}" type="button">Editar</button></div>`;
  } else action = `<div class="acts"><button class="btn" data-act="close" type="button">Fechar</button></div>`;
  openModal(`<h2>${esc(a.name)}</h2><span class="muted">${esc(ong ? ong.org || ong.name : '')} · ${esc(a.city)}</span>
    <img src="${petImg(a)}" alt="Foto de ${esc(a.name)}"><div class="chips"><span>${esc(a.species)}</span><span>${esc(a.age)}</span><span>Porte ${esc(a.size)}</span></div>
    <p style="margin-bottom:14px">${badge(a.status)}</p><p>${esc(a.desc)}</p>${action}`);
}

function showRequestForm(id) {
  const a = animal(id), u = curUser(); if (!a || !u) return;
  openModal(`<h2>Acolher ${esc(a.name)}</h2><p class="muted">Conte um pouco sobre você para a ONG.</p>
    <form data-form="request" data-id="${a.id}" novalidate style="margin-top:18px">
      ${sel('home', 'Onde você mora?', ['Casa com quintal', 'Casa sem quintal', 'Apartamento'], u.home || 'Casa com quintal')}
      ${txt('msg', 'Por que você quer acolher?', '', 'rows="4" placeholder="Experiência com animais, rotina da casa, tempo disponível..."')}
      <div class="fld"><label class="chk" for="f-ok"><input type="checkbox" id="f-ok" name="ok"> Confirmo que posso cuidar do animal até ele encontrar um lar definitivo.</label></div>
      <div class="acts"><button class="btn" data-act="close" type="button">Cancelar</button><button class="btn p" type="submit">Enviar solicitação</button></div></form>`);
}

function showPetForm(id) {
  const a = id ? animal(id) : null; UI.photo = null;
  openModal(`<h2>${a ? 'Editar animal' : 'Cadastrar animal'}</h2>
    <form data-form="pet" data-id="${a ? a.id : ''}" novalidate style="margin-top:14px">
      ${fld('name', 'Nome', 'text', a ? a.name : '')}
      <div class="f2">${sel('species', 'Espécie', ['Cachorro', 'Gato'], a ? a.species : 'Cachorro')}${sel('size', 'Porte', ['Pequeno', 'Médio', 'Grande'], a ? a.size : 'Médio')}</div>
      <div class="f2">${fld('age', 'Idade', 'text', a ? a.age : '', 'placeholder="Ex.: 2 anos"')}${fld('city', 'Cidade', 'text', a ? a.city : (curUser().city || ''))}</div>
      ${sel('status', 'Status', ['Disponível', 'Em lar temporário', 'Adotado'], a ? a.status : 'Disponível')}
      ${txt('desc', 'Descrição', a ? a.desc : '', 'rows="4"')}
      <div class="fld"><label for="f-photo">Foto (opcional)</label><input class="in" id="f-photo" name="photo" type="file" accept="image/*"><span class="muted" id="photoinfo" style="font-size:12px">${a && a.photo ? 'A foto atual será mantida se você não escolher outra.' : 'Sem foto, usamos uma ilustração.'}</span></div>
      <div class="acts"><button class="btn" data-act="close" type="button">Cancelar</button><button class="btn p" type="submit">Salvar</button></div></form>`);
}

function readImg(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const im = new Image();
      im.onerror = rej;
      im.onload = () => {
        const s = Math.min(1, 640 / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.72));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ---------- Formulários ---------- */
const FORMS = {
  login(f) {
    clearErrs(f);
    const email = f.elements.email.value.trim().toLowerCase(), pass = f.elements.pass.value;
    let bad = false;
    if (!isEmail(email)) { fieldErr(f, 'email', 'Informe um e-mail válido.'); bad = true; }
    if (!pass) { fieldErr(f, 'pass', 'Informe sua senha.'); bad = true; }
    if (bad) return;
    const u = DB.users.find(x => x.email.toLowerCase() === email && x.pass === pass);
    if (!u) return fieldErr(f, 'pass', 'E-mail ou senha incorretos.');
    setSession(u.id); toast('Bem-vindo(a), ' + (u.org || u.name.split(' ')[0]) + '!'); go('#/painel');
  },
  signup(f) {
    clearErrs(f);
    const role = f.dataset.role, v = n => f.elements[n] ? f.elements[n].value.trim() : '';
    let bad = false;
    const need = (n, m) => { if (!v(n)) { fieldErr(f, n, m); bad = true; } };
    if (role === 'vol') need('name', 'Informe seu nome.'); else { need('org', 'Informe o nome da ONG.'); need('resp', 'Informe o responsável.'); }
    const email = v('email').toLowerCase();
    if (!isEmail(email)) { fieldErr(f, 'email', 'Informe um e-mail válido.'); bad = true; }
    else if (DB.users.some(u => u.email.toLowerCase() === email)) { fieldErr(f, 'email', 'Este e-mail já está cadastrado.'); bad = true; }
    need('city', 'Informe sua cidade.');
    if (f.elements.pass.value.length < 8) { fieldErr(f, 'pass', 'A senha precisa ter ao menos 8 caracteres.'); bad = true; }
    if (f.elements.pass2.value !== f.elements.pass.value) { fieldErr(f, 'pass2', 'As senhas não conferem.'); bad = true; }
    if (!f.elements.terms.checked) { fieldErr(f, 'terms', 'É preciso aceitar os termos.'); bad = true; }
    if (bad) return;
    const u = role === 'vol'
      ? { id: uid(), role, name: v('name'), email, pass: f.elements.pass.value, phone: v('phone'), city: v('city'), home: v('home'), bio: '' }
      : { id: uid(), role, name: v('org'), org: v('org'), resp: v('resp'), email, pass: f.elements.pass.value, phone: v('phone'), city: v('city'), bio: '' };
    DB.users.push(u); save(); setSession(u.id); toast('Conta criada com sucesso!'); go('#/painel');
  },
  profile(f) {
    clearErrs(f);
    const u = curUser(), v = n => f.elements[n] ? f.elements[n].value.trim() : '';
    if (u.role === 'ong') {
      if (!v('org')) return fieldErr(f, 'org', 'Informe o nome da ONG.');
      u.org = u.name = v('org'); u.resp = v('resp');
    } else {
      if (!v('name')) return fieldErr(f, 'name', 'Informe seu nome.');
      u.name = v('name'); u.home = v('home');
    }
    u.phone = v('phone'); u.city = v('city'); u.bio = v('bio');
    save(); toast('Perfil atualizado!'); route();
  },
  request(f) {
    clearErrs(f);
    const u = curUser(), a = animal(f.dataset.id);
    const msg = f.elements.msg.value.trim();
    let bad = false;
    if (msg.length < 10) { fieldErr(f, 'msg', 'Escreva ao menos 10 caracteres.'); bad = true; }
    if (!f.elements.ok.checked) { fieldErr(f, 'ok', 'Confirme para continuar.'); bad = true; }
    if (bad || !a) return;
    const r = { id: uid(), animalId: a.id, volId: u.id, status: 'Pendente', date: today(), home: f.elements.home.value, msg };
    DB.requests.push(r);
    DB.messages.push({ id: uid(), reqId: r.id, from: u.id, text: msg, ts: new Date().toISOString() });
    save(); UI.conv = r.id; closeModal(true); toast('Solicitação enviada!'); go('#/solicitacoes');
  },
  send(f) {
    const u = curUser(), text = f.elements.text.value.trim();
    if (!text || !UI.conv) return;
    DB.messages.push({ id: uid(), reqId: UI.conv, from: u.id, text, ts: new Date().toISOString() });
    save(); $('#chatpane').innerHTML = chatPane(u); scrollMsgs();
    const i = $('#f-text'); if (i) i.focus();
  },
  pet(f) {
    clearErrs(f);
    const u = curUser(), v = n => f.elements[n].value.trim();
    let bad = false;
    [['name', 'Informe o nome.'], ['age', 'Informe a idade.'], ['city', 'Informe a cidade.'], ['desc', 'Escreva uma descrição.']].forEach(([n, m]) => { if (!v(n)) { fieldErr(f, n, m); bad = true; } });
    if (bad) return;
    const data = { name: v('name'), species: v('species'), size: v('size'), age: v('age'), city: v('city'), status: v('status'), desc: v('desc') };
    const id = f.dataset.id;
    if (id) { const a = animal(id); Object.assign(a, data); if (UI.photo) a.photo = UI.photo; }
    else DB.animals.push({ id: uid(), ongId: u.id, photo: UI.photo || '', ...data });
    if (!save()) return;
    UI.photo = null; closeModal(true); toast(id ? 'Animal atualizado!' : 'Animal cadastrado!'); route();
  }
};

/* ---------- Ações ---------- */
const ACT = {
  skip() { const c = $('#conteudo'); if (c) c.focus(); },
  scroll() { const c = $('#como'); if (c) c.scrollIntoView({ behavior: 'smooth' }); },
  menu() { const s = $('#sidenav'), c = $('.scrim'); if (!s) return; const o = s.classList.toggle('open'); if (c) c.classList.toggle('on', o); },
  logout() { setSession(null); UI.conv = null; toast('Você saiu da conta.'); go('#/'); },
  close() { closeModal(); },
  open(t) { showAnimal(t.dataset.id); },
  request(t) { showRequestForm(t.dataset.id); },
  clearflt() { ['q', 'fsp', 'fsz'].forEach(i => { const e = $('#' + i); if (e) e.value = ''; }); renderPets(); },
  newpet() { showPetForm(); },
  editpet(t) { showPetForm(t.dataset.id); },
  delpet(t) { const a = animal(t.dataset.id); if (a) confirmBox('Excluir ' + a.name + '? As solicitações ligadas a ele também serão removidas.', 'confirmdel', a.id); },
  confirmdel(t) {
    const id = t.dataset.id, rids = DB.requests.filter(r => r.animalId === id).map(r => r.id);
    DB.animals = DB.animals.filter(a => a.id !== id);
    DB.requests = DB.requests.filter(r => r.animalId !== id);
    DB.messages = DB.messages.filter(m => !rids.includes(m.reqId));
    save(); closeModal(true); toast('Animal excluído.'); route();
  },
  approve(t) {
    const r = DB.requests.find(x => x.id === t.dataset.id); if (!r) return;
    r.status = 'Aprovada'; const a = animal(r.animalId); if (a) a.status = 'Em lar temporário';
    DB.messages.push({ id: uid(), reqId: r.id, from: curUser().id, text: 'Sua solicitação foi aprovada! Vamos combinar os próximos passos por aqui.', ts: new Date().toISOString() });
    save(); toast('Solicitação aprovada.'); route();
  },
  refuse(t) {
    const r = DB.requests.find(x => x.id === t.dataset.id); if (!r) return;
    r.status = 'Recusada';
    DB.messages.push({ id: uid(), reqId: r.id, from: curUser().id, text: 'Obrigada pelo interesse. Desta vez não poderemos seguir com a solicitação.', ts: new Date().toISOString() });
    save(); toast('Solicitação recusada.'); route();
  },
  cancelreq(t) {
    const r = DB.requests.find(x => x.id === t.dataset.id); if (!r) return;
    r.status = 'Cancelada'; save(); toast('Solicitação cancelada.'); route();
  },
  chat(t) { UI.conv = t.dataset.id; closeModal(true); go('#/mensagens'); },
  selconv(t) { UI.conv = t.dataset.id; route(); }
};

/* ---------- Eventos globais (delegação) ---------- */
document.addEventListener('click', e => {
  const m = $('#modal');
  if (m && !m.hidden && e.target === m) { closeModal(); return; }
  const t = e.target.closest('[data-go],[data-act]'); if (!t) return;
  if (t.dataset.go) { e.preventDefault(); go(t.dataset.go); return; }
  const fn = ACT[t.dataset.act]; if (fn) { e.preventDefault(); fn(t, e); }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const fn = FORMS[f.dataset.form]; if (fn) fn(f);
});
document.addEventListener('input', e => { if (e.target.matches('[data-flt]')) renderPets(); });
document.addEventListener('change', async e => {
  if (e.target.matches('[data-flt]')) { renderPets(); return; }
  if (e.target.id === 'f-photo' && e.target.files && e.target.files[0]) {
    const info = $('#photoinfo');
    try { UI.photo = await readImg(e.target.files[0]); if (info) info.textContent = 'Foto selecionada.'; }
    catch (err) { UI.photo = null; if (info) info.textContent = 'Não foi possível ler esta imagem.'; }
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); const s = $('#sidenav'); if (s && s.classList.contains('open')) ACT.menu(); } });
window.addEventListener('hashchange', route);

/* Fecha o menu lateral ao navegar (mobile) */
document.addEventListener('click', e => { if (e.target.closest('.side-n nav a')) { const s = $('#sidenav'); if (s && s.classList.contains('open')) ACT.menu(); } });

route();
