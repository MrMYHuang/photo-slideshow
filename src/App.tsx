// This is a React app that can load all photos and music from a folder of user's storage, play photos as slideshow and play music in background simultaneously.

import { useState, useEffect, ChangeEvent, useRef } from "react";
import AudioPlayerOrig from "react-audio-player";
import { IonAlert, IonApp, IonButton, IonContent, IonInput, IonItem, IonLabel, IonList, IonPage, IonToggle, isPlatform, setupIonicReact } from '@ionic/react';

const AudioPlayer = process.env.NODE_ENV === 'production' ? (AudioPlayerOrig as any).default : AudioPlayerOrig;

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Theme variables */
import './theme/variables.css';

import './App.css'
import Globals from "./Globals";
import PackageInfos from '../package.json';

const photoSwitchTimeDefault = 5000;
const photoFormats = ['jpg', 'jpeg', 'svg', 'png', 'bmp', 'gif'];
const photoRegExp = new RegExp(`^[^.].*\.(${photoFormats.join('|')})$`, 'i');
const musicFormats = ['mp3', 'm4a', 'wav', 'ogg'];
const musicRegExp = new RegExp(`^[^.].*\.(${musicFormats.join('|')})$`, 'i');

setupIonicReact({
  mode: 'md',
});

export var serviceWorkCallbacks = {
  onLoad: function (registration: ServiceWorkerRegistration) { },
  onSuccess: function (registration: ServiceWorkerRegistration) { },
  onUpdate: function (registration: ServiceWorkerRegistration) { },
};

const sortFileByName = (f0: File, f1: File) => f0.name.localeCompare(f1.name);
const sortFileByTime = (f0: File, f1: File) => f0.lastModified - f1.lastModified;

// Define a component for displaying a music player
function MusicPlayer(props: { source: string, nextMusic: Function }) {
  // Define a function to handle the audio load event
  const handleLoad = () => {
    console.log("load");
  };

  // Define a function to handle the audio play event
  const handlePlay = () => {
    console.log("playing");
  };

  // Define a function to handle the audio pause event
  const handlePause = () => {
    console.log("paused");
  };

  const handleEnded = () => {
    console.log("ended");
    props.nextMusic();
  };

  // Return the JSX for rendering the music player
  return (
    <AudioPlayer
      src={props.source}
      onCanPlay={handleLoad}
      onPlay={handlePlay}
      onPause={handlePause}
      onEnded={handleEnded}
    />
  );
};

enum Status {
  Stop,
  Pause,
  Playing,
}

function App() {
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [status, setStatus] = useState<Status>(Status.Stop);
  // Use state hooks to store the photos and music arrays and the current photo index
  const [photos, setPhotos] = useState<File[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState('');
  const [currentPhotoId, setCurrentPhotoId] = useState(0);

  const [musics, setMusics] = useState<File[]>([]);
  const [currentMusic, setCurrentMusic] = useState('');
  const [currentMusicId, setCurrentMusicId] = useState(0);

  const [sortType, setSortType] = useState(false);
  const photoSwitchTimeInputEl = useRef<HTMLIonInputElement>(null);
  const [photoSwitchTime, setPhotoSwitchTime] = useState(photoSwitchTimeDefault);
  const [repeatPlay, setRepeatPlay] = useState(false);

  useEffect(() => {
    serviceWorkCallbacks.onLoad = (registration: ServiceWorkerRegistration) => {
      if (registration.installing || registration.waiting) {
        setShowUpdateAlert(true);
      }
    };

    serviceWorkCallbacks.onUpdate = (registration: ServiceWorkerRegistration) => {
      setShowUpdateAlert(true);
    };

    serviceWorkCallbacks.onSuccess = (registration: ServiceWorkerRegistration) => {
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (status != Status.Playing) { return; }

      if (!repeatPlay && currentPhotoId == photos.length - 1) {
        stop();
        return;
      }

      setCurrentPhotoId((prev) => (prev + 1) % photos.length);
    }, photoSwitchTime);
    // Return a cleanup function to clear the interval when the component unmounts
    return () => {
      clearInterval(interval);
    };
  }, [repeatPlay, photoSwitchTime, currentPhotoId, currentPhoto, status]);

  useEffect(() => {
    if (photos.length === 0) { return; }
    const photo = photos[currentPhotoId];
    photo.arrayBuffer().then((data) => {
      setCurrentPhoto(URL.createObjectURL(new Blob([data], { type: photo.type })));
    });
  }, [photos, currentPhotoId]);

  useEffect(() => {
    if (musics.length === 0) { return; }
    const music = musics[currentMusicId];
    music.arrayBuffer().then((data) => {
      setCurrentMusic(URL.createObjectURL(new Blob([data], { type: music.type })));
    });
  }, [musics, currentMusicId]);

  const nextMusic = () => {
    if (status !== Status.Playing) {
      stop();
      return;
    }

    if (musics.length == 1) {
      play();
    } else {
      setCurrentMusicId((prev) => (prev + 1) % musics.length);
    }
  }

  // Define a function to handle the folder input change event
  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const fileList = event.target.files!;
      const entries: File[] = [];
      for (const entry of fileList) {
        entries.push(entry);
      }

      // Filter out the photos and music by their file type
      const photos = entries.filter(
        (entry) => photoRegExp.test(entry.name)
      ).sort(sortType ? sortFileByTime : sortFileByName);

      if (photos.length == 0) {
        throw new Error('No image found!');
      }

      const musics = entries.filter(
        (entry) => musicRegExp.test(entry.name)
      ).sort(sortType ? sortFileByTime : sortFileByName);

      setPhotos(photos);
      setMusics(musics);

      if (photos.length > 0) {
        setCurrentPhotoId(0);
      }

      if (musics.length > 0) {
        setCurrentMusicId(0);
      }

      setStatus(Status.Pause);
    } catch (error: any) {
      // Handle any errors that may occur while accessing the folder or its contents
      alert(error.message);
    }
  };

  const play = () => {
    const audioEl = document.getElementsByTagName('audio')[0];
    if (audioEl.paused) {
      try {
        audioEl.play();
      } catch (error) {
        console.error(error);
      }
      audioEl.autoplay = true;
    }

    setStatus(Status.Playing);

    if (!isPlatform('ios')) {
      try {
        document.documentElement.requestFullscreen();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const pause = () => {
    pauseAudioAndExitFullScreen();

    setStatus(Status.Pause);
  };

  const pauseAudioAndExitFullScreen = () => {
    const audioEl = document.getElementsByTagName('audio')[0];
    try {
      audioEl.pause();
    } catch (error) {
      console.error(error);
    }
    audioEl.autoplay = false;

    if (!isPlatform('ios')) {
      document.exitFullscreen();
    }
  }

  const stop = () => {
    const el = document.getElementById('getFolder')! as HTMLInputElement;
    el.value = '';

    pauseAudioAndExitFullScreen();

    setStatus(Status.Stop);
  };

  // Return the JSX for rendering the app
  return (
    <IonApp>
      <IonPage>
        <IonContent>
          <div hidden={status == Status.Playing}>
            <IonList lines="full">
              <IonItem>
                <IonLabel className='ion-text-wrap'>請選擇本機目錄，其中包含相片或音樂，再按播放鈕。</IonLabel>
              </IonItem>
              <IonItem>
                <IonToggle checked={sortType} onIonChange={(ev) => {
                  setSortType(ev.target.checked);
                }}>排序（檔名/日期）</IonToggle>
              </IonItem>
              <IonItem>
                <IonInput
                  label="相片切換間格(毫秒)："
                  labelPlacement="stacked"
                  ref={photoSwitchTimeInputEl}
                  value={photoSwitchTime}
                  onIonChange={(ev) => {
                    const time = +(ev.target.value || photoSwitchTimeDefault);

                    if (time < 1) {
                      alert('不可小於 1!');
                      setPhotoSwitchTime(photoSwitchTimeDefault);
                      photoSwitchTimeInputEl.current!.value = photoSwitchTimeDefault;
                    } else {
                      setPhotoSwitchTime(time);
                    }
                  }}></IonInput>
              </IonItem>
              <IonItem>
                <IonToggle checked={repeatPlay} onIonChange={(ev) => {
                  setRepeatPlay(ev.target.checked);
                }}>循環播放</IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className='ion-text-wrap'>投影播放時，可點擊圖片暫停，並可重新選擇目錄。</IonLabel>
              </IonItem>

              <IonItem>
                <input id='getFolder'
                  hidden={true}
                  type='file'
                  placeholder='Folder of photos and music'
                  /* @ts-expect-error */
                  webkitdirectory={isPlatform('android') ? null : 'true' }
                  directory={isPlatform('android') ? null : 'true' }
                  multiple={true}
                  onChange={handleChange} />
                <IonButton slot="start" size="large" onClick={() => {
                  document.getElementById('getFolder')?.click();
                }}>選擇目錄</IonButton>
                {status !== Status.Stop && <IonButton slot="end" size="large" onClick={() => {
                  play();
                }}>播放</IonButton>}
              </IonItem>

              <IonItem>
                <IonLabel className='ion-text-wrap'>支援相片格式：{photoFormats.join(', ')}</IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel className='ion-text-wrap'>支援音樂格式：{musicFormats.join(', ')}</IonLabel>
              </IonItem>

              <IonItem>
                <div className='uiFont'>
                  <div hidden={Globals.isMacCatalyst()}>版本：{PackageInfos.pwaVersion}</div>
                  <div><a href="https://github.com/MrMYHuang/photo-slideshow" target="_new">原始碼</a></div>
                </div>
              </IonItem>
            </IonList>
          </div>

          {photos.length > 0 && status == Status.Playing &&
            <img src={currentPhoto} alt='img can not be shown' onClick={pause} />}
          <MusicPlayer source={currentMusic} nextMusic={nextMusic} />
        </IonContent>

        <IonAlert
          cssClass='uiFont'
          isOpen={showUpdateAlert}
          backdropDismiss={false}
          onDidPresent={async (ev) => {
            // Run SKIP_WAITING at onDidPresent event to avoid a race condition of
            // an old page fetching old JS chunks with a new service worker!
            // Which causes this alert fails to show.
            try {
              (await Globals.getServiceWorkerReg()).installing?.postMessage({ type: 'SKIP_WAITING' });
              (await Globals.getServiceWorkerReg()).waiting?.postMessage({ type: 'SKIP_WAITING' });
            } catch (error) {
              console.error(error);
            }

            Globals.getServiceWorkerRegUpdated().installing?.postMessage({ type: 'SKIP_WAITING' });
            Globals.getServiceWorkerRegUpdated().waiting?.postMessage({ type: 'SKIP_WAITING' });
          }}
          header={'App 已更新，請重啟!'}
          buttons={[
            {
              text: '關閉',
              cssClass: 'primary uiFont',
              handler: (value) => {
                setShowUpdateAlert(false);
              },
            },
          ]}
        />
      </IonPage>
    </IonApp>
  );
}

export default App
