// app.js
// Main application logic: Firebase + UI + groups/channels/DMs/edit/delete/invite
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, child, onValue, update, remove
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

/* ---------- FIREBASE CONFIG: replace if needed ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyD0OAOSTic5z4U4obChkOieVLtvhgmIfxU",
  authDomain: "friend-chat-eaabe.firebaseapp.com",
  databaseURL: "https://friend-chat-eaabe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "friend-chat-eaabe",
  storageBucket: "friend-chat-eaabe.appspot.com",
  messagingSenderId: "409498465855",
  appId: "1:409498465855:web:bfec1da1a2f29a1f73aa8a",
  measurementId: "G-DHE9SKBE8L"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ---------- DOM ---------- */
const channelsContainer = document.getElementById('channelsContainer');
const btnOpenCreateGroup = document.getElementById('btnOpenCreateGroup');
const btnOpenJoinGroup = document.getElementById('btnOpenJoinGroup');
const modalBackdrop = document.getElementById('modalBackdrop');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalContentCreateJoin = document.getElementById('modalContentCreateJoin');
const modalContentInvite = document.getElementById('modalContentInvite');
const modalContentEdit = document.getElementById('modalContentEdit');
const modalContentDelete = document.getElementById('modalContentDelete');

const modalGroupName = document.getElementById('modalGroupName');
const modalGroupPassword = document.getElementById('modalGroupPassword');
const modalDisplayName = document.getElementById('modalDisplayName');
const modalCreateGroupBtn = document.getElementById('modalCreateGroupBtn');
const modalJoinGroupBtn = document.getElementById('modalJoinGroupBtn');

const inviteLinkInput = document.getElementById('inviteLinkInput');
const modalCopyInviteBtn = document.getElementById('modalCopyInviteBtn');
const modalCloseInviteBtn = document.getElementById('modalCloseInviteBtn');

const editMessageTextarea = document.getElementById('editMessageTextarea');
const modalSaveEditBtn = document.getElementById('modalSaveEditBtn');
const modalCancelEditBtn = document.getElementById('modalCancelEditBtn');

const modalConfirmDeleteBtn = document.getElementById('modalConfirmDeleteBtn');
const modalCancelDeleteBtn = document.getElementById('modalCancelDeleteBtn');

const groupTitle = document.getElementById('groupTitle');
const channelSubTitle = document.getElementById('channelSubTitle');
const groupAvatar = document.getElementById('groupAvatar');
const messagesArea = document.getElementById('messagesArea');
const emptyState = document.getElementById('emptyState');

const composer = document.getElementById('composer');
const displayNameInput = document.getElementById('displayNameInput');
const messageInput = document.getElementById('messageInput');
const btnSend = document.getElementById('btnSend');

const membersList = document.getElementById('membersList');
const dmList = document.getElementById('dmList');
const btnInvite = document.getElementById('btnInvite');
const btnLeaveGroup = document.getElementById('btnLeaveGroup');

/* ---------- State ---------- */
let currentGroup = null;
let currentChannel = 'general'; // default channel inside group
let currentUser = null;
let editingMessage = null; // {group, channel, msgId}

/* ---------- Helpers ---------- */
function uid(){ return 'id' + Math.random().toString(36).slice(2,10); }
function sanitize(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function initials(name){
  if(!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  return parts.length>1 ? (parts[0][0]+parts[1][0]).toUpperCase() : parts[0].slice(0,2).toUpperCase();
}
function colorForName(name){
  const colors = ["#f44336","#e91e63","#9c27b0","#673ab7","#3f51b5","#2196f3","#03a9f4","#009688","#4caf50","#ff9800","#795548","#607d8b"];
  let h=0; for(let i=0;i<name.length;i++) h = name.charCodeAt(i) + ((h<<5)-h);
  return colors[Math.abs(h)%colors.length];
}

/* ---------- Modal utilities ---------- */
function showModal(mode){
  // modes: 'createJoin', 'invite', 'edit', 'delete'
  modalBackdrop.classList.add('show');
  modalContentCreateJoin.hidden = true;
  modalContentInvite.hidden = true;
  modalContentEdit.hidden = true;
  modalContentDelete.hidden = true;
  if(mode === 'createJoin'){ modalTitle.textContent = 'Create or Join Group'; modalContentCreateJoin.hidden = false; }
  if(mode === 'invite'){ modalTitle.textContent = 'Invite Link'; modalContentInvite.hidden = false; }
  if(mode === 'edit'){ modalTitle.textContent = 'Edit Message'; modalContentEdit.hidden = false; }
  if(mode === 'delete'){ modalTitle.textContent = 'Delete Message'; modalContentDelete.hidden = false; }
}
function hideModal(){ modalBackdrop.classList.remove('show'); }

/* close modal by clicking backdrop */
modalBackdrop.addEventListener('click', (e)=>{ if(e.target===modalBackdrop) hideModal(); });
document.getElementById('modalClose').addEventListener('click', hideModal);

/* ---------- Groups & Channels listing ---------- */
async function loadGroups(){
  const groupsRef = ref(db, 'groups');
  onValue(groupsRef, snap => {
    channelsContainer.innerHTML = '';
    if(!snap.exists()){ channelsContainer.innerHTML = '<div style="color:#9aa4b3;padding:8px">No groups yet</div>'; return; }
    snap.forEach(child => {
      const name = child.key;
      const el = document.createElement('div');
      el.className = 'channel';
      el.dataset.group = name;
      el.textContent = '# ' + name;
      el.addEventListener('click', ()=> openGroup(name));
      channelsContainer.appendChild(el);
    });
  });
}

/* ---------- Create group ---------- */
modalCreateGroupBtn.addEventListener('click', async () => {
  const g = modalGroupName.value.trim(); const pw = modalGroupPassword.value;
  const display = modalDisplayName.value.trim();
  if(!g || !pw || !display) return alert('Fill group, password & display name');
  await set(ref(db, 'groups/' + g + '/password'), pw);
  // make default channel list
  await set(ref(db, 'groups/' + g + '/channels'), { general: true });
  // add group creator as member
  await set(ref(db, 'groups/' + g + '/members/' + encodeURIComponent(display)), { joinedAt: new Date().toISOString() });
  modalGroupName.value=''; modalGroupPassword.value=''; modalDisplayName.value='';
  hideModal();
  openGroup(g, true, display);
});

/* ---------- Join group ---------- */
modalJoinGroupBtn.addEventListener('click', async () => {
  const g = modalGroupName.value.trim(); const pw = modalGroupPassword.value;
  const display = modalDisplayName.value.trim();
  if(!g || !pw || !display) return alert('Fill group, password & display name');
  const snap = await get(ref(db, 'groups/' + g + '/password'));
  if(!snap.exists()) return alert('Group not found');
  if(String(snap.val()) !== String(pw)) return alert('Wrong password');
  // add presence
  await set(ref(db, 'groups/' + g + '/members/' + encodeURIComponent(display)), { joinedAt: new Date().toISOString() });
  modalGroupName.value=''; modalGroupPassword.value=''; modalDisplayName.value='';
  hideModal();
  openGroup(g, false, display);
});

/* ---------- Open group & load channels/messages ---------- */
async function openGroup(groupName, created=false, displayName=null){
  // store
  currentGroup = groupName;
  if(displayName) currentUser = displayName;
  else if(!currentUser) currentUser = (displayName || localStorage.getItem('fc_display') || '');
  if(currentUser) displayNameInput.value = currentUser;
  // update header
  groupTitle.textContent = groupName;
  channelSubTitle.textContent = '#general';
  groupAvatar.textContent = groupName.charAt(0).toUpperCase();
  groupAvatar.style.background = colorForName(groupName);
  // highlight channel in left nav
  document.querySelectorAll('.channel').forEach(c=>c.classList.remove('active'));
  const myCh = [...document.querySelectorAll('.channel')].find(c => c.dataset.group === groupName);
  if(myCh) myCh.classList.add('active');
  // show composer
  composer.style.display = 'flex'; composer.setAttribute('aria-hidden','false');
  emptyState.style.display = 'none';
  // load channels for this group
  loadChannelsForGroup(groupName);
  // load default channel messages
  loadMessages(groupName, currentChannel);
  // load members
  loadMembers(groupName);
  // store last used
  localStorage.setItem('fc_last_group', groupName);
  localStorage.setItem('fc_display', currentUser || '');
}

/* ---------- Channels for a group ---------- */
async function loadChannelsForGroup(groupName){
  const channelsRef = ref(db, 'groups/' + groupName + '/channels');
  onValue(channelsRef, snap => {
    // update left channels: show as children under the group in left sidebar if group active
    // For simplicity we will keep channels UI on top level: highlight #general as default
    // (The left channels list is used as group list; channels UI in this example will be inside center header)
    // If you want per-group channel list, implement more DOM here.
  });
}

/* ---------- Messages (load & render) ---------- */
function loadMessages(groupName, channelName='general'){
  messagesArea.innerHTML = ''; // clear
  const msgsRef = ref(db, `groups/${groupName}/messages/${channelName}`);
  onValue(msgsRef, snap => {
    messagesArea.innerHTML = '';
    if(!snap.exists()) {
      messagesArea.appendChild(emptyState);
      return;
    }
    snap.forEach(child => {
      const id = child.key;
      const msg = child.val();
      renderMessage(id, msg);
    });
    // autoscroll
    messagesArea.scrollTop = messagesArea.scrollHeight;
  });
}

/* ---------- Render single message ---------- */
function renderMessage(id, msg){
  const art = document.createElement('article'); art.className = 'message'; art.dataset.id = id;
  const av = document.createElement('div'); av.className = 'msg-avatar'; av.textContent = initials(msg.name || 'Anon'); av.style.background = colorForName(msg.name || 'Anon');
  const body = document.createElement('div'); body.className = 'msg-body';
  const meta = document.createElement('div'); meta.className = 'msg-meta';
  const userEl = document.createElement('div'); userEl.className = 'msg-user'; userEl.textContent = sanitize(msg.name || 'Unknown');
  const tag = document.createElement('div'); tag.className = 'msg-tag'; tag.textContent = '#0000';
  const time = document.createElement('div'); time.className = 'msg-time'; time.textContent = new Date(msg.time).toLocaleTimeString();
  const actions = document.createElement('div'); actions.className = 'msg-actions';
  const btnEdit = document.createElement('div'); btnEdit.className='msg-action'; btnEdit.textContent='Edit';
  const btnDelete = document.createElement('div'); btnDelete.className='msg-action'; btnDelete.textContent='Delete';
  actions.appendChild(btnEdit); actions.appendChild(btnDelete);

  btnEdit.addEventListener('click', ()=> openEditModal(id, msg));
  btnDelete.addEventListener('click', ()=> openDeleteModal(id, msg));

  meta.appendChild(userEl); meta.appendChild(tag); meta.appendChild(time); meta.appendChild(actions);

  const text = document.createElement('div'); text.className='msg-text'; text.textContent = sanitize(msg.text || '');
  body.appendChild(meta); body.appendChild(text);
  art.appendChild(av); art.appendChild(body);
  messagesArea.appendChild(art);
}

/* ---------- Send message (push) ---------- */
btnSend.addEventListener('click', async ()=>{
  if(!currentGroup) return alert('Join a group first');
  const name = displayNameInput.value.trim() || currentUser || 'Anon';
  currentUser = name;
  const text = messageInput.value.trim();
  if(!text) return;
  const channel = currentChannel || 'general';
  const messagesRef = ref(db, `groups/${currentGroup}/messages/${channel}`);
  await push(messagesRef, { name, text, time: new Date().toISOString() });
  messageInput.value = '';
});

/* Enter to send */
messageInput.addEventListener('keypress', (e)=> { if(e.key === 'Enter') btnSend.click(); });

/* ---------- Edit message ---------- */
function openEditModal(msgId, msg){
  editingMessage = { id: msgId, group: currentGroup, channel: currentChannel };
  editMessageTextarea.value = msg.text || '';
  showModal('edit');
}
modalSaveEditBtn.addEventListener('click', async ()=>{
  if(!editingMessage) return;
  const newText = editMessageTextarea.value.trim();
  if(!newText) return alert('Message cannot be empty');
  const msgRef = ref(db, `groups/${editingMessage.group}/messages/${editingMessage.channel}/${editingMessage.id}`);
  await update(msgRef, { text: newText, editedAt: new Date().toISOString() });
  editingMessage = null;
  hideModal();
});
modalCancelEditBtn.addEventListener('click', ()=> { editingMessage = null; hideModal(); });

/* ---------- Delete message ---------- */
let deletingMessage = null;
function openDeleteModal(msgId, msg){
  deletingMessage = { id: msgId, group: currentGroup, channel: currentChannel };
  showModal('delete');
}
modalConfirmDeleteBtn.addEventListener('click', async ()=>{
  if(!deletingMessage) return;
  const msgRef = ref(db, `groups/${deletingMessage.group}/messages/${deletingMessage.channel}/${deletingMessage.id}`);
  await remove(msgRef);
  deletingMessage = null;
  hideModal();
});
modalCancelDeleteBtn.addEventListener('click', ()=> { deletingMessage = null; hideModal(); });

/* ---------- Members list ---------- */
function loadMembers(groupName){
  const membersRef = ref(db, `groups/${groupName}/members`);
  onValue(membersRef, snap => {
    membersList.innerHTML = '';
    if(!snap.exists()){ membersList.innerHTML = '<div style="color:#9aa4b3;padding:8px">No members</div>'; return; }
    snap.forEach(child => {
      const key = decodeURIComponent(child.key);
      const entry = child.val();
      const div = document.createElement('div'); div.className = 'member';
      const av = document.createElement('div'); av.className = 'm-avatar'; av.textContent = initials(key); av.style.background = colorForName(key);
      const meta = document.createElement('div'); meta.innerHTML = `<div class="m-name">${sanitize(key)}</div><div class="m-presence">joined</div>`;
      div.appendChild(av); div.appendChild(meta); membersList.appendChild(div);
    });
  });
}

/* ---------- Invite: produce link (still requires password) ---------- */
btnInvite.addEventListener('click', ()=>{
  if(!currentGroup) return alert('Join a group first');
  // create link pointing to repo URL + query params (example)
  const base = location.origin + location.pathname;
  const link = `${base}?invite=${encodeURIComponent(currentGroup)}`;
  inviteLinkInput.value = link;
  showModal('invite');
});
modalCopyInviteBtn.addEventListener('click', ()=> {
  inviteLinkInput.select();
  document.execCommand('copy');
  alert('Link copied (remember to share password separately)');
  hideModal();
});
modalCloseInviteBtn.addEventListener('click', hideModal);

/* Copy invite if URL contains invite param (prefill modal) */
(function checkInviteParam(){
  const params = new URLSearchParams(location.search);
  if(params.has('invite')) {
    const g = params.get('invite');
    modalGroupName.value = g;
    showModal('createJoin');
  }
})();

/* ---------- Leave group ---------- */
btnLeaveGroup.addEventListener('click', async ()=>{
  if(!currentGroup || !currentUser) return;
  await remove(ref(db, `groups/${currentGroup}/members/${encodeURIComponent(currentUser)}`));
  // simple UI cleanup
  currentGroup = null; currentUser = null;
  messagesArea.innerHTML = '<div class="empty-state">No group selected. Create or join a group to begin.</div>';
  composer.style.display='none';
  groupTitle.textContent = 'Not in a group';
  channelSubTitle.textContent = 'Create or join a group to start chatting';
  membersList.innerHTML = '<div style="color:#9aa4b3;padding:8px">No group selected</div>';
});

/* ---------- Load initial groups list ---------- */
loadGroups();

/* ---------- Open create/join modal handlers ---------- */
btnOpenCreateGroup.addEventListener('click', ()=>{ modalTitle.textContent='Create Group'; modalContentCreateJoin.hidden=false; showModal('createJoin'); modalCreateGroupBtn.style.display='inline-block'; modalJoinGroupBtn.style.display='none'; });
btnOpenJoinGroup.addEventListener('click', ()=>{ modalTitle.textContent='Join Group'; modalContentCreateJoin.hidden=false; showModal('createJoin'); modalCreateGroupBtn.style.display='none'; modalJoinGroupBtn.style.display='inline-block'; });

/* ---------- On load, restore last display name ---------- */
window.addEventListener('load', ()=>{
  const saved = localStorage.getItem('fc_display'); if(saved) displayNameInput.value = saved;
});
displayNameInput.addEventListener('change', ()=> localStorage.setItem('fc_display', displayNameInput.value.trim()));

/* expose some globals for debugging (optional) */
window._FC = { openGroup, sendMessage: ()=>btnSend.click(), db };
