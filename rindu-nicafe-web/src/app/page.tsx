"use client";

import { useState, useActionState } from "react";
import { loginAction, LoginState } from "./actions/auth";
import styles from "./login.module.css";

const initialState: LoginState = {};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
        <div className={styles.loginCard}>
          <div className={styles.headerContainer}>
            <div className={styles.logoContainer}>
              <img
                src="/logo.png"
                alt="Rindu Nicafe Logo"
                className={styles.logoImage}
              />
            </div>
            <h1 className={styles.title}>Rindu Nicafe</h1>
          </div>

          {state.error && (
            <div className={styles.errorMessage}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>error</span>
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} aria-label="Login Form" className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <div className={styles.inputContainer}>
                <span className={styles.iconLeft}>
                  <span className="material-symbols-outlined">person</span>
                </span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className={styles.input}
                  placeholder="Masukkan username Anda"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputContainer}>
                <span className={styles.iconLeft}>
                  <span className="material-symbols-outlined">lock</span>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`${styles.input} ${styles.inputPassword}`}
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className={styles.toggleButton}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isPending}
            >
              {isPending ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>Owner & Karyawan</p>
        </div>
      </main>
    </div>
  );
}
