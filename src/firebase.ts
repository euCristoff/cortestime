import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuração para o ambiente de Preview do AI Studio (Banco de testes integrado)
const previewConfig = {
  apiKey: "AIzaSyARuWfsZIwy75KaGmWw0_IiulZ_Lp-bgH8",
  authDomain: "positive-decoder-ndzmz.firebaseapp.com",
  projectId: "positive-decoder-ndzmz",
  storageBucket: "positive-decoder-ndzmz.firebasestorage.app",
  messagingSenderId: "576867565081",
  appId: "1:576867565081:web:e829e40f91fb500902f488",
  measurementId: ""
};

// Configuração oficial de Produção do seu projeto Firebase (cortestimey)
const prodConfig = {
  apiKey: "AIzaSyADa-hOGVn76WPx0PMGzIYNO79Q_1qHEFA",
  authDomain: "cortestimey.firebaseapp.com",
  projectId: "cortestimey",
  storageBucket: "cortestimey.firebasestorage.app",
  messagingSenderId: "661972450235",
  appId: "1:661972450235:web:a0a21f3e89e70679a3e29e",
  measurementId: "G-J15M5HFBYQ"
};

// Detecta se está rodando no ambiente de desenvolvimento/preview do AI Studio
const isPreview = typeof window !== "undefined" && (
  window.location.hostname.includes("run.app") ||
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("aistudio")
);

const activeConfig = isPreview ? previewConfig : prodConfig;

// Inicializa o Firebase com a configuração ativa
const app = initializeApp(activeConfig);

// No preview do AI Studio usamos a base de dados customizada criada no projeto "positive-decoder-ndzmz".
// Em produção (no seu projeto "cortestimey"), usamos o banco de dados oficial padrão (default).
export const db = isPreview 
  ? getFirestore(app, "ai-studio-barberflow-ad72a5af-c542-494c-b68b-a33897de01d2")
  : getFirestore(app);

// Inicializa o Auth com a instância ativa
export const auth = getAuth(app);

export { app };


