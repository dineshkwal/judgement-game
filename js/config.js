/* ---------- FIREBASE CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyC3-j38Zol7jqdPaCxr8gQ6eyqyfBmJiv4",
  authDomain: "judgement-game-ef741.firebaseapp.com",
  databaseURL: "https://judgement-game-ef741-default-rtdb.firebaseio.com",
  projectId: "judgement-game-ef741",
  storageBucket: "judgement-game-ef741.firebasestorage.app",
  messagingSenderId: "518151609641",
  appId: "1:518151609641:web:339ef9c79ce4ac98f22b38"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

