import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import appletConfig from "../firebase-applet-config.json";

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

// Determina se estamos rodando no ambiente de preview do AI Studio ou localhost
const isDev = typeof window !== "undefined" && (
  window.location.hostname.includes("localhost") || 
  window.location.hostname.includes("127.0.0.1") || 
  window.location.hostname.includes("run.app") ||
  window.location.hostname.includes("webcontainer")
);

const activeConfig = isDev ? appletConfig : prodConfig;

// Inicializa o Firebase com a configuração ativa
const app = initializeApp(activeConfig);

// Sempre usa a base de dados default ou nomeada dependendo do ambiente
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, isDev ? (appletConfig.firestoreDatabaseId || undefined) : undefined);

// Inicializa o Auth com a instância ativa
export const auth = getAuth(app);

export { app };
