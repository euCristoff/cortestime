import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import appletConfig from "../firebase-applet-config.json";

// Configure Firestore log level to silent / error only (silences standard idle stream disconnection notices)
setLogLevel("error");

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

// Sempre usa a configuração oficial do Cortestimey
const activeConfig = prodConfig;

// Inicializa o Firebase com a configuração ativa
const app = initializeApp(activeConfig);

// Inicializa o Firestore com persistência robusta de cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Inicializa o Auth com a instância ativa
export const auth = getAuth(app);

export { app };

