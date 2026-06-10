/* ============================================
   ROYAL MOTORS — Firebase Sync  (Approach A: Mirror)
   localStorage stays the live store; every fo_* data key is
   mirrored to Firestore so the logged-in user's data follows
   them across devices.

   Firestore layout:  users/{uid}/store/{key}  ->  { json, updatedAt }
   ============================================ */
const FleetSync = (() => {

  // Per-device preferences we do NOT sync to the cloud.
  const SKIP = new Set(['fo_theme', 'fo_auth']);
  const isDataKey = k => typeof k === 'string' && k.startsWith('fo_') && !SKIP.has(k);

  let currentUid  = null;
  const dirty     = new Set();
  let flushTimer  = null;

  const storeCol = uid => window.fbDB.collection('users').doc(uid).collection('store');

  // Pull all cloud data into localStorage. Returns number of docs pulled.
  async function pull(uid) {
    if (!window.fbDB || !uid) return 0;
    const snap = await storeCol(uid).get();
    snap.forEach(doc => {
      const d = doc.data();
      if (d && typeof d.json === 'string') localStorage.setItem(doc.id, d.json);
    });
    return snap.size;
  }

  // Push one key's current localStorage value to the cloud.
  async function pushKey(uid, key) {
    if (!window.fbDB || !uid) return;
    const json = localStorage.getItem(key);
    if (json == null) return;
    await storeCol(uid).doc(key).set({
      json,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  // Push every data key — used to seed the cloud on first login.
  async function pushAll(uid) {
    if (!window.fbDB || !uid) return 0;
    const keys = Object.keys(localStorage).filter(isDataKey);
    await Promise.all(keys.map(k => pushKey(uid, k)));
    return keys.length;
  }

  function flush() {
    if (!currentUid || dirty.size === 0) return;
    const keys = [...dirty]; dirty.clear();
    keys.forEach(k => pushKey(currentUid, k).catch(e => console.warn('[Sync] push failed:', k, e)));
  }

  // Called by FleetDB.save() on every write.
  function queuePush(key) {
    if (!isDataKey(key)) return;
    dirty.add(key);
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 1200);
  }

  // Track auth so we always know whose data to sync.
  if (window.fbAuth) {
    window.fbAuth.onAuthStateChanged(async user => {
      currentUid = user ? user.uid : null;
      if (!currentUid) return;
      // On first page load per session, pull cloud data into localStorage.
      if (!sessionStorage.getItem('fo_pulled')) {
        sessionStorage.setItem('fo_pulled', '1');
        if (window.FleetDB) window.FleetDB.showLoadingOverlay('Syncing from cloud…');
        try {
          const count = await pull(currentUid);
          if (count > 0) { location.reload(); return; }
          // Nothing in cloud yet — push local seed data up
          await pushAll(currentUid);
        } catch(e) { console.warn('[Sync] initial pull failed:', e); }
        if (window.FleetDB) window.FleetDB.hideLoadingOverlay();
      }
      flush();
    });
  }

  return { pull, pushAll, pushKey, queuePush, get uid() { return currentUid; } };
})();
window.FleetSync = FleetSync;

/* ============================================
   ImageStore — compress images, then store in Firebase Storage (returns a URL).
   Falls back to a compressed base64 data-URL when Storage/auth isn't available,
   so uploads never overflow localStorage and nothing breaks offline.
   ============================================ */
window.ImageStore = (() => {
  // Downscale + JPEG-compress a File to a small data-URL.
  function compress(file, maxDim = 700, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w >= h && w > maxDim)      { h = Math.round(h * maxDim / w); w = maxDim; }
          else if (h > w && h > maxDim)  { w = Math.round(w * maxDim / h); h = maxDim; }
          else if (w > maxDim)           { h = Math.round(h * maxDim / w); w = maxDim; }
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          try { resolve(c.toDataURL('image/jpeg', quality)); }
          catch (err) { reject(err); }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Upload a data-URL to Firebase Storage and return the download URL.
  // Returns the data-URL itself if Storage/auth isn't ready (safe fallback).
  async function upload(dataUrl, folder) {
    try {
      const uid = window.FleetSync && window.FleetSync.uid;
      if (window.fbStorage && uid) {
        const id  = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const ref = window.fbStorage.ref('users/' + uid + '/' + (folder || 'img') + '/' + id + '.jpg');
        await ref.putString(dataUrl, 'data_url');
        return await ref.getDownloadURL();
      }
    } catch (e) { console.warn('[ImageStore] upload failed — keeping inline image:', e); }
    return dataUrl;
  }

  return { compress, upload };
})();
