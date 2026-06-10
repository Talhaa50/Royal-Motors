// Royal Motors — Firebase Configuration & Initialization
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey:            "AIzaSyDTK8TKOa5WsUqJsxjtCZRSvIwSWhMX-f0",
  authDomain:        "royal-motors-98d40.firebaseapp.com",
  projectId:         "royal-motors-98d40",
  storageBucket:     "royal-motors-98d40.firebasestorage.app",
  messagingSenderId: "548510359481",
  appId:             "1:548510359481:web:2e506d68b98e829139a068",
  measurementId:     "G-2PSJCG376H"
};

// Initialize Firebase using the compat SDK (exposes the global `firebase`).
// The SDK <script> tags must be loaded BEFORE this file.
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  window.fbAuth = firebase.auth();
  window.fbDB   = firebase.firestore();
  // Storage is optional — only available on pages that load the storage SDK.
  if (firebase.storage) { try { window.fbStorage = firebase.storage(); } catch (e) {} }
} else {
  console.error('[Firebase] SDK not loaded — check that the firebasejs <script> tags come before firebase-config.js');
}
