import { supabase } from './supabase.js';
import { getAvatarUrl, timeAgo, initDarkMode, toggleDarkMode } from './utils.js';

/* ── Dark Mode ── */
initDarkMode();
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    const isDark = toggleDarkMode();
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
  });
  
  const isDark = document.documentElement.classList.contains('dark-mode');
  darkModeToggle.textContent = isDark ? '☀️' : '🌙';
}

let currentUser = null;
let currentProfile = null;
let currentConversation = null;

/* ── Auth check ── */
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) {
    window.location.href = 'login.html';
    return null;
  }
  
  currentUser = user;
  currentProfile = profile;
  return { user, profile };
}

/* ── Load conversations ── */
async function loadConversations() {
  const isStudent = currentProfile.role === 'student';
  
  let query = supabase
    .from('messages')
    .select('*, sender_id, receiver_id, jobs(title, id), sender:profiles!messages_sender_id_fkey(full_name, avatar_url, business_name), receiver:profiles!messages_receiver_id_fkey(full_name, avatar_url, business_name)')
    .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
    .order('created_at', { ascending: false });

  const { data: messages, error } = await query;

  if (error) {
    document.getElementById('conversations').innerHTML = '<p style="color:var(--text-3);padding:20px;text-align:center;">Failed to load conversations.</p>';
    return;
  }

  if (!messages || messages.length === 0) {
    document.getElementById('conversations').innerHTML = '<p style="color:var(--text-3);padding:20px;text-align:center;">No conversations yet.</p>';
    document.getElementById('emptyMessages').classList.remove('hidden');
    return;
  }

  document.getElementById('emptyMessages').classList.add('hidden');

  // Group messages by conversation (unique user pairs)
  const conversations = {};
  messages.forEach(msg => {
    const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
    const otherUser = msg.sender_id === currentUser.id ? msg.receiver : msg.sender;
    const key = otherUserId;
    
    if (!conversations[key]) {
      conversations[key] = {
        userId: otherUserId,
        user: otherUser,
        jobId: msg.job_id,
        jobTitle: msg.jobs?.title,
        lastMessage: msg,
        unreadCount: 0
      };
    }
    
    if (msg.receiver_id === currentUser.id && !msg.read_at) {
      conversations[key].unreadCount++;
    }
    
    // Keep the most recent message
    if (new Date(msg.created_at) > new Date(conversations[key].lastMessage.created_at)) {
      conversations[key].lastMessage = msg;
    }
  });

  const conversationsArray = Object.values(conversations).sort((a, b) => 
    new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
  );

  const conversationsEl = document.getElementById('conversations');
  conversationsEl.innerHTML = conversationsArray.map(conv => {
    const avatar = conv.user?.avatar_url
      ? `<img src="${getAvatarUrl(conv.user.avatar_url)}" alt="${conv.user.full_name || conv.user.business_name}" />`
      : `<span>${(conv.user?.full_name || conv.user?.business_name || 'U')[0].toUpperCase()}</span>`;
    
    const name = conv.user?.full_name || conv.user?.business_name || 'Unknown';
    const lastMsg = conv.lastMessage.content.slice(0, 50) + (conv.lastMessage.content.length > 50 ? '...' : '');
    const unreadBadge = conv.unreadCount > 0 
      ? `<span class="notification-badge">${conv.unreadCount}</span>` 
      : '';

    return `
      <div class="conversation-item" data-user-id="${conv.userId}" data-job-id="${conv.jobId || ''}">
        <div class="conversation-avatar">${avatar}</div>
        <div class="conversation-info">
          <div class="conversation-header">
            <strong>${name}</strong>
            <span class="conversation-time">${timeAgo(conv.lastMessage.created_at)}</span>
          </div>
          <div class="conversation-preview">
            ${conv.jobTitle ? `<span class="job-tag">${conv.jobTitle}</span>` : ''}
            <span>${lastMsg}</span>
          </div>
        </div>
        ${unreadBadge}
      </div>
    `;
  }).join('');

  // Bind click events
  conversationsEl.querySelectorAll('.conversation-item').forEach(item => {
    item.addEventListener('click', () => {
      openConversation(item.dataset.userId, item.dataset.jobId);
    });
  });
}

/* ── Open conversation ── */
async function openConversation(otherUserId, jobId) {
  currentConversation = { otherUserId, jobId };
  
  // Get other user info
  const { data: otherUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', otherUserId)
    .single();

  if (!otherUser) return;

  // Update UI
  document.getElementById('conversationsList').classList.add('hidden');
  document.getElementById('messageThreadContainer').classList.remove('hidden');
  
  const name = otherUser.full_name || otherUser.business_name || 'Unknown';
  document.getElementById('threadTitle').textContent = name;
  document.getElementById('threadSubtitle').textContent = jobId ? 'Regarding job application' : 'Direct message';

  // Load messages
  await loadMessages(otherUserId, jobId);

  // Mark as read
  await markMessagesAsRead(otherUserId, jobId);
}

/* ── Load messages ── */
async function loadMessages(otherUserId, jobId) {
  let query = supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
    .order('created_at', { ascending: true });

  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data: messages, error } = await query;

  if (error) {
    document.getElementById('messageThread').innerHTML = '<p style="color:var(--text-3);padding:20px;text-align:center;">Failed to load messages.</p>';
    return;
  }

  const threadEl = document.getElementById('messageThread');
  
  if (!messages || messages.length === 0) {
    threadEl.innerHTML = '<p style="color:var(--text-3);padding:20px;text-align:center;">No messages yet. Start the conversation!</p>';
    return;
  }

  threadEl.innerHTML = messages.map(msg => {
    const isSent = msg.sender_id === currentUser.id;
    return `
      <div class="message-bubble ${isSent ? 'sent' : 'received'}">
        ${msg.content}
        <div class="message-time">${timeAgo(msg.created_at)}</div>
      </div>
    `;
  }).join('');

  // Scroll to bottom
  threadEl.scrollTop = threadEl.scrollHeight;
}

/* ── Mark messages as read ── */
async function markMessagesAsRead(otherUserId, jobId) {
  let query = supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('receiver_id', currentUser.id)
    .eq('sender_id', otherUserId)
    .is('read_at', null);

  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  await query;
}

/* ── Send message ── */
async function sendMessage(content) {
  if (!currentConversation || !content.trim()) return;

  const { error } = await supabase.from('messages').insert({
    sender_id: currentUser.id,
    receiver_id: currentConversation.otherUserId,
    job_id: currentConversation.jobId || null,
    content: content.trim()
  });

  if (error) {
    alert('Failed to send message: ' + error.message);
    return;
  }

  // Reload messages
  await loadMessages(currentConversation.otherUserId, currentConversation.jobId);
  
  // Clear input
  document.getElementById('messageInput').value = '';
}

/* ── Event listeners ── */
document.getElementById('messageForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('messageInput');
  const btn = document.getElementById('sendMessageBtn');
  
  const content = input.value.trim();
  if (!content) return;

  btn.disabled = true;
  btn.textContent = 'Sending...';

  await sendMessage(content);

  btn.disabled = false;
  btn.textContent = 'Send';
});

document.getElementById('backToConversations')?.addEventListener('click', () => {
  document.getElementById('messageThreadContainer').classList.add('hidden');
  document.getElementById('conversationsList').classList.remove('hidden');
  currentConversation = null;
  loadConversations();
});

/* ── Navbar scroll ── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

/* ── Logout ── */
document.getElementById('navLogout')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});

/* ── Initialize ── */
async function init() {
  const auth = await checkAuth();
  if (auth) {
    await loadConversations();
  }
}

init();
