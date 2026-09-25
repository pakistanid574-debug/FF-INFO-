// Supabase Configuration
const SUPABASE_URL = "https://vahwyycftctxlvbwxeyi.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_I1ipl6-iKa69lDImEI6GCw_n86fSoos";

// Safe Initialization
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const authTitle = document.getElementById('auth-title');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const toggleAuthBtn = document.getElementById('toggle-auth-btn');
const authToggleText = document.getElementById('auth-toggle-text');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');
const postContent = document.getElementById('post-content');
const publishBtn = document.getElementById('publish-btn');
const postsFeed = document.getElementById('posts-feed');

let isSignUp = false;

// Toggle Login / Signup Form
if (toggleAuthBtn) {
  toggleAuthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;
    if (isSignUp) {
      authTitle.innerText = "Sign Up to GlobePulse";
      usernameInput.style.display = "block";
      authSubmitBtn.innerText = "Sign Up";
      authToggleText.innerText = "Already have an account?";
      toggleAuthBtn.innerText = "Login";
    } else {
      authTitle.innerText = "Login to GlobePulse";
      usernameInput.style.display = "none";
      authSubmitBtn.innerText = "Login";
      authToggleText.innerText = "Don't have an account?";
      toggleAuthBtn.innerText = "Sign Up";
    }
  });
}

// Authentication Click Handler
if (authSubmitBtn) {
  authSubmitBtn.addEventListener('click', async () => {
    if (!supabaseClient) return alert("Database connection error. Please refresh the page.");

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const username = usernameInput.value.trim();

    if (!email || !password) {
      return alert("Please enter both email and password.");
    }

    if (isSignUp) {
      if (!username) return alert("Please enter a username.");
      
      authSubmitBtn.innerText = "Processing...";
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      authSubmitBtn.innerText = "Sign Up";

      if (error) return alert("Signup Error: " + error.message);

      if (data.user) {
        await supabaseClient.from('profiles').insert([{ id: data.user.id, username }]);
        alert("Signup Successful! Logging you in...");
        checkUser();
      }
    } else {
      authSubmitBtn.innerText = "Logging in...";
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      authSubmitBtn.innerText = "Login";

      if (error) return alert("Login Error: " + error.message);
      checkUser();
    }
  });
}

// Check User Session
async function checkUser() {
  if (!supabaseClient) return;
  
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user) {
    authSection.style.display = "none";
    appSection.style.display = "block";
    logoutBtn.style.display = "inline-block";

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    userDisplay.innerText = `@${profile ? profile.username : 'User'}`;
    loadPosts();
  } else {
    authSection.style.display = "block";
    appSection.style.display = "none";
    logoutBtn.style.display = "none";
    userDisplay.innerText = "";
  }
}

// Logout Action
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    checkUser();
  });
}

// Publish Post Action
if (publishBtn) {
  publishBtn.addEventListener('click', async () => {
    const content = postContent.value.trim();
    if (!content) return alert("Please write something before posting.");

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert("Session expired. Please log in again.");

    publishBtn.innerText = "Posting...";
    const { error } = await supabaseClient.from('posts').insert([{ user_id: user.id, content }]);
    publishBtn.innerText = "Post Globally";

    if (error) {
      alert("Post Error: " + error.message);
    } else {
      postContent.value = "";
      loadPosts();
    }
  });
}

// Load Feed Posts
async function loadPosts() {
  if (!postsFeed || !supabaseClient) return;
  postsFeed.innerHTML = "<p>Loading posts...</p>";

  const { data: posts, error } = await supabaseClient
    .from('posts')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false });

  if (error) {
    postsFeed.innerHTML = "<p>Error loading feed.</p>";
    return;
  }

  if (!posts || posts.length === 0) {
    postsFeed.innerHTML = "<p>No posts yet. Be the first to post!</p>";
    return;
  }

  postsFeed.innerHTML = posts.map(post => `
    <div class="post-item">
      <div class="post-header">@${post.profiles ? post.profiles.username : 'Anonymous'}</div>
      <div class="post-content">${post.content}</div>
      <div class="post-actions">
        <button class="action-btn" onclick="likePost(${post.id})">❤️ Like</button>
        <button class="action-btn" onclick="sharePost(${post.id})">🔗 Share</button>
      </div>
    </div>
  `).join('');
}

// Global Functions for Actions
window.likePost = (id) => alert("Liked post #" + id);
window.sharePost = (id) => {
  navigator.clipboard.writeText(window.location.href);
  alert("Post link copied to clipboard!");
};

// Start Check
checkUser();
