import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuração oficial do seu projeto Firebase (cortestimey)
const prodConfig = {
  apiKey: "AIzaSyADa-hOGVn76WPx0PMGzIYNO79Q_1qHEFA",
  authDomain: "cortestimey.firebaseapp.com",
  projectId: "cortestimey",
  storageBucket: "cortestimey.firebasestorage.app",
  messagingSenderId: "661972450235",
  appId: "1:661972450235:web:a0a21f3e89e70679a3e29e",
  measurementId: "G-J15M5HFBYQ"
};

const activeConfig = prodConfig;

// Inicializa o Firebase com a configuração ativa
const app = initializeApp(activeConfig);

// Sempre usa a base de dados default do projeto cortestimey
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Inicializa o Auth com a instância ativa
export const auth = getAuth(app);

export { app };


