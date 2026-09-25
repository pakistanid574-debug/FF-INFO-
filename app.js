// Supabase Configuration
const SUPABASE_URL = "https://vahwyycftctxlvbwxeyi.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_I1ipl6-iKa69lDImEI6GCw_n86fSoos";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

// Auth Toggle (Login <-> Signup)
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

// Authentication Handler
authSubmitBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const username = usernameInput.value.trim();

  if (!email || !password) return alert("Please fill all required fields");

  if (isSignUp) {
    if (!username) return alert("Please enter a username");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    
    // Profile Entry
    if (data.user) {
      await supabase.from('profiles').insert([{ id: data.user.id, username }]);
      alert("Signup successful! You can now log in.");
      checkUser();
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    checkUser();
  }
});

// Check Logged In User
async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    authSection.style.display = "none";
    appSection.style.display = "block";
    logoutBtn.style.display = "inline-block";
    
    // Fetch Profile
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    userDisplay.innerText = `@${profile ? profile.username : 'User'}`;
    loadPosts();
  } else {
    authSection.style.display = "block";
    appSection.style.display = "none";
    logoutBtn.style.display = "none";
    userDisplay.innerText = "";
  }
}

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  checkUser();
});

// Publish Post
publishBtn.addEventListener('click', async () => {
  const content = postContent.value.trim();
  if (!content) return alert("Post cannot be empty");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return alert("Please log in again");

  const { error } = await supabase.from('posts').insert([{ user_id: user.id, content }]);
  if (error) {
    alert("Error publishing post: " + error.message);
  } else {
    postContent.value = "";
    loadPosts();
  }
});

// Load Global Posts Feed
async function loadPosts() {
  postsFeed.innerHTML = "<p>Loading posts...</p>";
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false });

  if (error) {
    postsFeed.innerHTML = "<p>Error loading posts.</p>";
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

// Actions
window.likePost = (id) => alert("Liked post #" + id);
window.sharePost = (id) => {
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied to clipboard!");
};

// Initial Load
checkUser();
    
