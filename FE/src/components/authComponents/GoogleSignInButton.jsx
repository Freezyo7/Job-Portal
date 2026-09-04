import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Renders Google's own sign-in button via Google Identity Services (loaded
 * in index.html). `onCredential` receives the ID token string to send to
 * POST /api/auth/google/ — this component never talks to our backend.
 */
const GoogleSignInButton = ({ onCredential, onError }) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not set — Google sign-in is hidden.");
      return;
    }

    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          if (response?.credential) onCredential(response.credential);
          else onError?.(new Error("Google did not return a credential"));
        },
      });
      window.google.accounts.id.renderButton(divRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: 336,
        text: "continue_with",
      });
    };

    // The GIS script is loaded with `defer` in index.html, so it can still
    // be mid-fetch when this component first mounts — poll briefly instead
    // of assuming `window.google` already exists.
    if (window.google?.accounts?.id) {
      render();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          render();
        }
      }, 100);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
  }, [onCredential, onError]);

  if (!CLIENT_ID) return null;

  return <div ref={divRef} className="flex justify-center" />;
};

export default GoogleSignInButton;
