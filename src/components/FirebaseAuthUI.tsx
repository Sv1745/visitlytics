import React, { useEffect, useRef } from 'react';
import { auth } from '@/integrations/firebase/client';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    // Add or remove providers as needed
    {
      provider: 'google.com',
      providerName: 'Google',
    },
    {
      provider: 'password',
      providerName: 'Email',
    },
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => false, // Prevent redirect
  },
};

export const FirebaseAuthUI: React.FC = () => {
  const uiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uiRef.current) return;
    // FirebaseUI instance reuse
    let ui = firebaseui.auth.AuthUI.getInstance();
    if (!ui) {
      ui = new firebaseui.auth.AuthUI(auth);
    }
    ui.start(uiRef.current, uiConfig);
    return () => {
      ui.reset();
    };
  }, []);

  return <div ref={uiRef} />;
}; 