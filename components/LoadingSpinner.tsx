'use client';

import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading scene...' }: LoadingSpinnerProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.spinner}>
          <div className={styles.ring}></div>
          <div className={styles.ring}></div>
          <div className={styles.ring}></div>
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
