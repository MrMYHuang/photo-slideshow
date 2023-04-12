import { isPlatform } from '@ionic/react';

const pwaUrl = process.env.PUBLIC_URL || '';
const bugReportApiUrl = 'https://vh6ud1o56g.execute-api.ap-northeast-1.amazonaws.com/bugReportMailer';

async function clearAppData() {
  localStorage.clear();
}

const electronBackendApi: any = (window as any).electronBackendApi;

const consoleLog = console.log.bind(console);
const consoleError = console.error.bind(console);

let log = '';
function getLog() {
  return log;
}

function enableAppLog() {
  console.log = function () {
    log += '----- Info ----\n';
    log += (Array.from(arguments)) + '\n';
    consoleLog.apply(console, arguments as any);
  };

  console.error = function () {
    log += '----- Error ----\n';
    log += (Array.from(arguments)) + '\n';
    if (arguments[0] && arguments[0].isAxiosError) {
      log += `URL: ${arguments[0].config.url}\n`;
    }
    consoleError.apply(console, arguments as any);
  };
}

function disableAppLog() {
  log = '';
  console.log = consoleLog;
  console.error = consoleError;
}

function disableAndroidChromeCallout(event: any) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

// Workable but imperfect.
function disableIosSafariCallout(this: Window, event: any) {
  const s = this.getSelection();
  if ((s?.rangeCount || 0) > 0) {
    const r = s?.getRangeAt(0);
    setTimeout(() => {
      s?.removeAllRanges();
      setTimeout(() => {
        s?.addRange(r!);
      }, 50);
    }, 50);
  }
}

//const webkit = (window as any).webkit;
function copyToClipboard(text: string) {
  try {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'clipboard-read' } as any).then(() => {
        navigator.clipboard.writeText(text);
      });
    } else {
      navigator.clipboard && navigator.clipboard.writeText(text);
    }
  } catch (error) {
    console.error(error);
  }
}

function shareByLink(dispatch: Function, url: string = window.location.href) {
  copyToClipboard(url);
  dispatch({
    type: 'TMP_SET_KEY_VAL',
    key: 'shareTextModal',
    val: {
      show: true,
      text: decodeURIComponent(url),
    },
  });
}

function isMacCatalyst() {
  return isPlatform('ios') && ((window as any).webkit);
}

const checkServiceWorkerInterval = 20;
let serviceWorkerLoaded = false;
let _serviceWorkerReg: ServiceWorkerRegistration;
async function getServiceWorkerReg() {
  if (serviceWorkerLoaded) {
    return _serviceWorkerReg;
  }

  return new Promise<ServiceWorkerRegistration>((ok, fail) => {
    let waitTime = 0;
    const waitLoading = setInterval(() => {
      if (navigator.serviceWorker.controller != null) {
        clearInterval(waitLoading);
        ok(_serviceWorkerReg);
      } else if (waitTime > 1e3 * 10) {
        clearInterval(waitLoading);
        fail('getServiceWorkerReg timeout!');
      }
      waitTime += checkServiceWorkerInterval;
    }, checkServiceWorkerInterval);
  });
}
function setServiceWorkerReg(serviceWorkerReg: ServiceWorkerRegistration) {
  _serviceWorkerReg = serviceWorkerReg;
}

let _serviceWorkerRegUpdated: ServiceWorkerRegistration;
function getServiceWorkerRegUpdated() {
  return _serviceWorkerRegUpdated;
}
function setServiceWorkerRegUpdated(serviceWorkerRegUpdated: ServiceWorkerRegistration) {
  _serviceWorkerRegUpdated = serviceWorkerRegUpdated;
}

const Globals = {
  localFileProtocolName: 'safe-file-protocol',
  getLog,
  enableAppLog,
  disableAppLog,
  pwaUrl,
  bugReportApiUrl,
  updateApp: () => {
    return new Promise(async resolve => {
      navigator.serviceWorker.getRegistrations().then(async regs => {
        const hasUpdates = await Promise.all(regs.map(reg => (reg.update() as any).then((newReg: ServiceWorkerRegistration) => {
          return newReg.installing !== null || newReg.waiting !== null;
        })));
        resolve(hasUpdates.reduce((prev, curr) => prev || curr, false));
      });
    });
  },
  isMacCatalyst,
  isTouchDevice: () => {
    return (isPlatform('ios') && !isMacCatalyst()) || isPlatform('android');
  },
  isStoreApps: () => {
    return isPlatform('pwa') || isPlatform('electron');
  },
  electronBackendApi,
  clearAppData,
  disableAndroidChromeCallout,
  disableIosSafariCallout,
  copyToClipboard,
  shareByLink,
  setServiceWorkerReg,
  getServiceWorkerReg,
  setServiceWorkerRegUpdated,
  getServiceWorkerRegUpdated,
};

export default Globals;
