const storage = require('node-persist');

let isInitialized = false;

// async function initStorage() {
//   if (!isInitialized) {
//     try {
//       await storage.init({
//         dir: './storage',
//         stringify: JSON.stringify,
//         parse: JSON.parse,
//         logging: false,
//         ttl: false
//       });
//       isInitialized = true;
//       console.log('✅ Storage initialized');
//     } catch (err) {
//       console.error('Storage init error:', err);
//     }
//   }
// }

async function initStorage(dirPath) {
  if (!isInitialized) {
    try {
      await storage.init({
        dir: dirPath || './storage', // fallback for dev
        stringify: JSON.stringify,
        parse: JSON.parse,
        logging: false,
        ttl: false
      });
      isInitialized = true;
      console.log('✅ Storage initialized at', dirPath || './storage');
    } catch (err) {
      console.error('Storage init error:', err);
    }
  }
}

async function setItem(key, value) {
  await storage.init(); // safe fallback
  try {
    return await storage.setItem(key, value);
  } catch (err) {
    console.error('Storage setItem error:', err);
  }
}

async function getItem(key) {
  await storage.init();
  try {
    return await storage.getItem(key);
  } catch (err) {
    console.warn(`Corrupted storage file for key "${key}", removing...`);
    await storage.removeItem(key).catch(() => {});
    return null;
  }
}


async function removeItem(key) {
   await storage.init();
  return storage.removeItem(key);
}

async function getAllKeys() {
  await storage.init();
  return storage.keys();
}

async function clearAll() {
  await storage.init();
  await storage.clear();
  return true;
}

module.exports = {
  initStorage,
  setItem,
  getItem,
  removeItem,
  getAllKeys,
  clearAll
};
