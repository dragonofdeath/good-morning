import { StrictMode, useMemo, useState, useEffect, useRef } from 'react';
import { TimePickerFull } from './components/ui/time-picker-full';
import { useWakeLock } from './use-wake-lock';

type Frame = {
  duration: number;
  image: string;
  title: string;
  speak: string;
};

type Config = {
  startTime: string;
  frames: Frame[];
};

const MINUTE = 1000 * 60;
const config: Config = {
  startTime: '07:00:00',
  frames: [
    {
      title: 'Pusryčiai',
      speak: 'Time to get up and eat breakfast',
      duration: 30 * MINUTE,
      image:
        'https://static.wixstatic.com/media/be0f33_38e6bea2b63c4498825c8b91ffc72bc4~mv2.png',
    },
    {
      title: 'Dantukai',
      speak: 'Time to brush your teeth and go to toilet',
      duration: 10 * MINUTE,
      image:
        'https://static.wixstatic.com/media/9d3f58_de16759d939a473da09e9b32934ff37e~mv2.png',
    },
    {
      title: 'Rengtis',
      speak: 'Time to get dressed',
      duration: 10 * MINUTE,
      image:
        'https://static.wixstatic.com/media/9d3f58_2c1e236b13f04d768e6fdde6bfae2d6f~mv2.png',
    },
    {
      title: 'Iškeliaujam',
      speak: 'Time to go',
      duration: 10 * MINUTE,
      image:
        'https://static.wixstatic.com/media/9d3f58_ab0ea45553cb40558089e95c89aa23ca~mv2.png',
    },
    {
      title: 'VĖLUOJAM :(((',
      speak: 'We are late, go go go!!!',
      duration: 50 * MINUTE,
      image: '',
    },
  ],
};
type FullFrame = Frame & { start: Date; end: Date };
const getConfigWithTimeIntervals = (
  currentDay: Date,
  config: Config
): FullFrame[] => {
  const result = config.frames.reduce<{ startTime: Date; frames: FullFrame[] }>(
    (acc, f) => {
      const startTime = acc.startTime;
      const endTime = new Date(startTime.getTime() + f.duration);
      acc.frames.push({
        ...f,
        start: startTime,
        end: endTime,
      });
      acc.startTime = endTime;
      return acc;
    },
    {
      startTime: new Date(currentDay.toDateString() + ' ' + config.startTime),
      frames: [],
    }
  );

  return result.frames;
};

const getTimeLeft = (endTime: Date, time: number): string => {
  const totalSeconds = Math.ceil((endTime.getTime() - time) / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const App = () => {
  useWakeLock();
  const [time, setTime] = useState<number>(Date.now());
  const frames = useMemo(
    () => getConfigWithTimeIntervals(new Date(), config),
    []
  );

  const currentFrame = frames.find(
    (f) => f.start.getTime() <= time && f.end.getTime() >= time
  );
  const lastFrame = useRef<FullFrame | undefined>(undefined);
  if (currentFrame !== lastFrame.current) {
    lastFrame.current = currentFrame;
    if (currentFrame) {
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(currentFrame.speak);
        speechSynthesis.speak(utterance);
      }, 0);
    }
  }
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => t + 1000);
    }, 1000);
    return () => clearInterval(interval);
  });
  return (
    <StrictMode>
      <div className="w-screen h-screen flex flex-col items-center justify-center">
        <TimePickerFull
          date={new Date(time)}
          setDate={(date) => date && setTime(date.getTime())}
        />
        {currentFrame ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center relative"
            style={{
              backgroundImage: `url(${currentFrame.image})`,
              backgroundSize: 'cover',
            }}
          >
            <div className="bg-black bg-opacity-80 p-4 rounded-lg text-center">
              <h1 className="text-8xl text-white">
                {currentFrame.title.toUpperCase()}
              </h1>
              <h2 className="text-4xl text-white">liko laiko</h2>
              <h2 className="text-8xl text-white font-mono">
                {getTimeLeft(currentFrame.end, time)}
              </h2>
            </div>

            <ProgreessBar
              percent={
                100 -
                ((currentFrame.end.getTime() - time) / currentFrame.duration) *
                  100
              }
              className="absolute bottom-0 left-0 right-0"
            />
          </div>
        ) : (
          <div>Show starts at {frames[0].start.toLocaleTimeString()}</div>
        )}
      </div>
    </StrictMode>
  );
};

const ProgreessBar = ({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) => {
  return (
    <div
      className={`w-full h-8 bg-gray-300 overflow-hidden opacity-80
${className}`}
    >
      <div
        className="h-full bg-green-500"
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );
};
