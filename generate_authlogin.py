import re

with open("components/boostai/AuthLogin.tsx", "r", encoding="utf-8") as f:
    original_auth = f.read()

with open("components/boostai/body.jsx", "r", encoding="utf-8") as f:
    body_jsx = f.read()

# We need to construct the new AuthLogin.tsx manually.

new_auth_tsx = """/**
 * AuthLogin — real authentication page replacing the legacy login.html redirect.
 *
 * Supports:
 * - Email/password sign in and sign up
 * - Google OAuth sign in
 * - Error display from failed OAuth callbacks
 * - Redirect back to the page the user was trying to access
 */

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import "./legacy-auth.css";

type AuthMode = "signin" | "signup";

interface AuthLoginProps {
  redirectTo?: string;
  errorMessage?: string;
}

export function AuthLogin({ redirectTo = "/dashboard", errorMessage }: AuthLoginProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorMessage ?? "");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
          data: {
            full_name: fullName,
          }
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccessMessage(
          "Check your email for a confirmation link. Once confirmed, you can sign in."
        );
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        // Successful sign in — redirect
        window.location.href = redirectTo;
      }
    }

    setLoading(false);
  }

  async function handleOAuthSignIn(provider: "google" | "apple" | "azure") {
    if (provider !== "google") {
        setError(`${provider} login is not configured yet.`);
        return;
    }
    
    setLoading(true);
    setError("");

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      {/* ================= LEFT : auth form ================= */}
      <section className="pane">
        <a className="brand anim d1" href="/" aria-label="BoostAI home">
          <span className="brand-mark"><svg style={{fillRule: 'evenodd', clipRule: 'evenodd', strokeLinecap: 'round', strokeLinejoin: 'round'}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1003 955">
            <path d="M359.859 712.191C370.752 709.183 381.645 706.176 392.672 703.131C384.503 722.51 374.537 740.422 359.359 755.335C347.626 766.863 335.397 777.513 321.482 786.325C306.779 795.635 291.701 804.166 275.35 810.189C259.947 815.862 244.406 821.159 228.917 826.594C227.572 827.066 226.156 827.338 224.259 827.428C222.072 826.96 220.359 826.432 218.733 826.627C207.397 827.991 196.107 829.805 184.747 830.888C172.85 832.023 161.342 829.345 149.956 825.912C149.915 825.819 149.681 825.797 149.681 825.797C149.681 825.797 150.005 825.996 150.003 826.285C149.994 826.766 149.988 826.958 149.983 827.151C139.009 822.468 136.447 812.698 135.04 802.291C133.113 788.042 134.891 773.859 137.192 759.907C140.327 740.902 145.186 722.2 152.921 704.467C157.867 693.129 162.978 681.772 169.188 671.106C174.34 662.258 180.952 654.203 187.401 646.186C191.94 640.543 197.048 635.294 202.342 630.339C208.912 624.19 216.28 618.87 222.648 612.533C227.079 608.124 232.589 605.606 237.579 602.264C243.04 598.606 249.292 596.082 255.324 593.336C265.866 588.538 276.502 583.949 287.099 579.272C287.381 579.637 287.663 580.001 287.946 580.366C285.832 584.899 283.79 589.469 281.591 593.961C272.572 612.388 268.288 631.894 270.145 652.285C271.957 672.179 280.672 688.879 297.328 700.531C304.481 705.534 312.375 709.502 321.913 711.302C324.121 711.715 325.618 711.835 327.115 711.955C327.115 711.955 327.022 712.01 327.284 712.23C338.336 714.739 349.105 714.429 359.859 712.191Z" opacity="1" fill="#3b82f6"/>
            <path d="M177.182 477.965C182.785 463.209 187.416 447.985 194.24 433.817C202.503 416.66 213.097 400.74 226.555 386.962C231.635 381.762 236.034 375.814 241.512 371.1C253.889 360.449 266.123 349.443 279.568 340.272C294.915 329.803 311.219 320.609 327.673 311.933C338.94 305.992 351.134 301.789 362.987 296.988C372.497 293.136 382.002 289.213 391.72 285.951C400.888 282.874 410.323 280.586 419.667 278.05C420.648 277.784 421.81 278.188 422.196 278.221C414.079 288.997 405.909 299.774 397.815 310.609C390.963 319.782 383.579 328.635 377.55 338.326C369.27 351.633 361.788 365.461 354.426 379.311C340.91 404.737 329.607 431.137 320.862 458.598C318.808 465.047 317.066 471.599 314.874 477.999C314.448 479.244 312.724 480.628 311.393 480.887C299.289 483.238 287.105 485.185 275.011 487.584C261.837 490.197 248.651 492.831 235.627 496.081C224.548 498.845 213.692 502.498 202.242 505.471C200.569 504.931 199.267 504.221 198.234 504.501C192.96 505.929 187.748 507.593 182.528 509.215C179.634 510.114 176.766 511.093 173.262 512.241C173.262 510.064 173.082 508.916 173.291 507.844C174.933 499.395 176.741 490.976 178.255 482.504C178.505 481.1 177.57 479.483 177.182 477.965Z" opacity="1" fill="#3b82f6"/>
            <path d="M586.034 672.176C592.428 670.108 598.829 668.062 605.214 665.965C608.393 664.922 611.589 663.906 614.695 662.669C620.135 660.501 625.596 658.355 630.896 655.876C642.857 650.282 655.247 645.35 666.486 638.537C677.735 631.717 687.803 622.948 698.371 615.008C700.842 613.152 703.24 611.197 706.641 608.526C706.419 610.845 706.579 612.357 706.103 613.632C702.892 622.224 699.502 630.749 696.301 639.344C695.894 640.438 696.246 641.815 696.246 643.088C695.75 643.448 694.476 643.878 694.111 644.709C683.671 668.45 672.326 691.711 657.041 712.787C646.413 727.441 634.484 740.869 620.874 752.996C607.375 765.025 592.673 775.037 576.885 783.523C558.921 793.179 539.913 800.187 519.801 803.965C515.058 804.856 510.288 805.605 504.877 805.788C512.398 788.099 518.17 770.248 522.172 751.554C523.362 749.883 524.722 748.449 524.869 746.901C526.684 727.812 528.399 708.712 529.927 689.599C530.162 686.657 530.782 685.281 533.98 684.686C548.625 681.961 563.233 679.021 577.796 675.885C580.674 675.265 583.294 673.443 586.034 672.176Z" opacity="1" fill="#3b82f6"/>
            <path d="M884.065 73.9298C878.776 73.6283 873.489 73.1116 868.197 73.0614C840.662 72.8 813.691 76.9729 787.092 83.7962C771.195 87.874 755.34 92.1163 739.197 96.1282C750.67 92.3083 762.403 88.6137 774.161 84.9974C778.767 83.5807 783.426 82.3396 788.832 81.0312C790.743 80.6697 791.883 80.2954 793.023 79.9212C793.023 79.9212 792.99 79.9957 793.326 80.0262C794.775 79.6761 795.888 79.2956 797.001 78.9151C797.001 78.9151 796.986 78.9811 797.34 79.0767C799.139 78.7546 800.583 78.3369 802.028 77.9191C802.028 77.9191 801.989 77.999 802.341 78.03C804.14 77.6818 805.586 77.3026 807.032 76.9233C807.032 76.9233 806.986 77.0056 807.34 77.0318C809.137 76.6777 810.582 76.2973 812.026 75.9169C812.026 75.9169 811.989 75.9957 812.357 76.0307C814.494 75.6872 816.263 75.3089 818.032 74.9305C818.032 74.9305 817.986 75.0049 818.355 75.0432C820.494 74.6947 822.264 74.3079 824.033 73.921C824.033 73.921 823.981 74.0097 824.361 74.0269C826.837 73.6721 828.933 73.3002 831.029 72.9282C831.029 72.9282 830.987 73.0019 831.413 73.0373C845.384 72.7111 858.929 72.1869 872.476 72.0913C876.335 72.064 880.202 73.2826 884.065 73.9298Z" opacity="1" fill="#3b82f6"/>
            <path d="M890.911 246.618C890.418 247.007 890.005 247.005 889.282 246.999C892.179 233.588 895.68 220.242 898.519 206.756C901.969 190.367 904.851 173.858 908.018 157.409C908.224 156.342 908.77 155.341 909.478 154.582C909.141 161.227 908.484 167.599 907.827 173.97C905.879 183.639 904.195 193.371 901.922 202.963C898.494 217.435 894.655 231.81 890.911 246.618Z" opacity="1" fill="#3b82f6"/>
          </svg></span>
          <span className="brand-name">Boost<b>AI</b></span>
          <span className="brand-tag">EXAMS</span>
        </a>

        <div className="form-wrap">
          <form className="form" onSubmit={handleEmailAuth}>
            <div className="switch-row anim d2">
              <a className="switch" href="/uni" id="switchBtn">
                <span id="switchLabel">Switch to University</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                     strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
              </a>
            </div>

            <h1 className="anim d2" id="title">{mode === "signin" ? "Log in" : "Create your account"}</h1>
            <p className="sub anim d2" id="subline">
              {mode === "signin" ? (
                <>Don't have an account? <a id="toggleMode" onClick={() => { setMode("signup"); setError(""); setSuccessMessage(""); }}>Sign up</a></>
              ) : (
                <>Already have an account? <a id="toggleMode" onClick={() => { setMode("signin"); setError(""); setSuccessMessage(""); }}>Log in</a></>
              )}
            </p>

            {error && (
              <div className="note show bad anim d3" id="note">{error}</div>
            )}
            {successMessage && (
              <div className="note show ok anim d3" id="note">{successMessage}</div>
            )}

            {/* SSO */}
            <div className="sso anim d3">
              <button type="button" onClick={() => handleOAuthSignIn("google")}>
                <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue with Google
              </button>
            </div>

            <div className="divider anim d4">or</div>

            {/* email/password */}
            <div className={`field anim d4 ${mode === "signin" ? "hidden" : ""}`} id="nameField">
              <label htmlFor="name">Full name</label>
              <div className="input"><input id="name" type="text" autoComplete="name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} required={mode === "signup"} disabled={loading} /></div>
            </div>

            <div className="field anim d4">
              <label htmlFor="email">Email</label>
              <div className="input"><input id="email" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} /></div>
            </div>

            <div className="field anim d5">
              <label htmlFor="password">Password</label>
              <div className="input has-btn">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                <button className="eye" id="eye" type="button" aria-label="Show password" onClick={() => setShowPassword(!showPassword)}>
                  {!showPassword ? (
                    <svg id="eyeOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg id="eyeOff" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className={`submit anim d6 ${loading ? 'loading' : ''}`} id="submit" disabled={loading}><span className="spin"></span><span id="submitLabel">{mode === "signin" ? "Log in" : "Create account"}</span></button>

            {mode === "signin" && <a className="forgot anim d6" id="forgot">Forgot your password?</a>}

            <p className="legal anim d6">By continuing, you agree to the <a href="#" id="terms">Terms of Use</a>.</p>
          </form>
        </div>
      </section>

      {/* ================= RIGHT : product preview ================= */}
      <aside className="showcase">
        <span className="glow"></span>

        <div className="demo">
          <div className="demo-top"></div>
          <div className="demo-bar">
            <span className="demo-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v14H4z"/><path d="M9 5v14"/></svg>
              Kinematics
            </span>
            <span className="demo-dots"><i className="on"></i><i className="on"></i><i></i><i></i><i></i></span>
          </div>
          <div className="demo-body">
            <div className="qno"><span className="n">1</span><span>A diver steps off a 10&nbsp;m platform and falls freely. Roughly how fast are they moving when they hit the water? (take g&nbsp;=&nbsp;9.8&nbsp;m/s²)</span></div>
            <div className="qmono">v² = u² + 2as&nbsp;&nbsp;·&nbsp;&nbsp;u = 0, s = 10&nbsp;m</div>
            <div className="steps">
              <div className="step"><span className="b">1</span><span>v² = 0 + 2 × 9.8 × 10 = 196</span></div>
              <div className="step"><span className="b">2</span><span>v = √196</span></div>
            </div>
            <div className="ans">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Answer&nbsp;&nbsp;v = 14&nbsp;m/s
            </div>
            <div className="tryit"><span>Now you try →</span><span className="mono">drop from 20 m</span></div>
          </div>
        </div>

        <div className="float a"><span className="d"></span>Step-by-step</div>
        <div className="float b">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19"/></svg>
          A fresh question every time
        </div>

        <p className="showcase-cap">We show you <b>how</b> to do it — then generate a different one for you to try.</p>
      </aside>
    </div>
  );
}
"""

with open("components/boostai/AuthLogin.tsx", "w", encoding="utf-8") as f:
    f.write(new_auth_tsx)

print("Updated AuthLogin.tsx")
