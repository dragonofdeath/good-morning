import { useEffect } from 'react';

export function useWakeLock() {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        document.addEventListener('click', async () => {     
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => {
            console.log('Wake lock released');
          });
        });
        console.log('Wake lock active');
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    requestWakeLock();
    return () => {
      if (wakeLock) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        wakeLock.release().then(() => {
          wakeLock = null;
          console.log('Wake lock released manually');
        });
      }
    };
  }, []);
}
