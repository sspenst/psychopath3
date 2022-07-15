import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AppContext } from '../contexts/appContext';
import Control from '../models/control';
import DataModal from './modal/dataModal';
import EditorLayout from './level/editorLayout';
import GameContainer from './level/gameContainer';
import Level from '../models/db/level';
import LevelDataType from '../constants/levelDataType';
import LevelDataTypeModal from '../components/modal/levelDataTypeModal';
import { PageContext } from '../contexts/pageContext';
import PublishLevelModal from './modal/publishLevelModal';
import SizeModal from '../components/modal/sizeModal';
import World from '../models/db/world';
import cloneLevel from '../helpers/cloneLevel';
import toast from 'react-hot-toast';
import useLevelBySlug from '../hooks/useLevelBySlug';
import Square from './level/square';
import { useRouter } from 'next/router';

interface EditorProps {
  isDirty: boolean;
  level: Level;
  setIsDirty: (isDirty: boolean) => void;
  setLevel: React.Dispatch<React.SetStateAction<Level | undefined>>;
  worlds: World[] | undefined;
}

export default function Editor({ isDirty, level, setIsDirty, setLevel, worlds }: EditorProps) {
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isLevelDataTypeOpen, setIsLevelDataTypeOpen] = useState(false);
  const { isModalOpen } = useContext(PageContext);
  const [isPublishLevelOpen, setIsPublishLevelOpen] = useState(false);
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [levelDataType, setLevelDataType] = useState(LevelDataType.Default);
  const router = useRouter();
  const { setIsLoading } = useContext(AppContext);
  const { id } = router.query;
  const { mutateLevel } = useLevelBySlug(level.slug);

  const handleKeyDown = useCallback(code => {
    switch (code) {
    case 'Digit0':
      setLevelDataType(LevelDataType.Default);
      break;
    case 'Digit1':
      setLevelDataType(LevelDataType.Wall);
      break;
    case 'Digit2':
      setLevelDataType(LevelDataType.Block);
      break;
    case 'Digit3':
      setLevelDataType(LevelDataType.End);
      break;
    case 'Digit4':
      setLevelDataType(LevelDataType.Start);
      break;
    case 'Digit5':
      setLevelDataType(LevelDataType.Hole);
      break;
    case 'Digit6':
      setLevelDataType(LevelDataType.Left);
      break;
    case 'Digit7':
      setLevelDataType(LevelDataType.Up);
      break;
    case 'Digit8':
      setLevelDataType(LevelDataType.Right);
      break;
    case 'Digit9':
      setLevelDataType(LevelDataType.Down);
      break;
    case 'KeyA':
      setLevelDataType(LevelDataType.UpLeft);
      break;
    case 'KeyB':
      setLevelDataType(LevelDataType.UpRight);
      break;
    case 'KeyC':
      setLevelDataType(LevelDataType.DownRight);
      break;
    case 'KeyD':
      setLevelDataType(LevelDataType.DownLeft);
      break;
    case 'KeyE':
      setLevelDataType(LevelDataType.NotLeft);
      break;
    case 'KeyF':
      setLevelDataType(LevelDataType.NotUp);
      break;
    case 'KeyG':
      setLevelDataType(LevelDataType.NotRight);
      break;
    case 'KeyH':
      setLevelDataType(LevelDataType.NotDown);
      break;
    case 'KeyI':
      setLevelDataType(LevelDataType.LeftRight);
      break;
    case 'KeyJ':
      setLevelDataType(LevelDataType.UpDown);
      break;
    default:
      break;
    }
  }, []);

  const handleKeyDownEvent = useCallback(event => {
    if (!isDataOpen && !isModalOpen && !isSizeOpen) {
      const { code } = event;

      handleKeyDown(code);
    }
  }, [handleKeyDown, isDataOpen, isModalOpen, isSizeOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDownEvent);

    return () => {
      document.removeEventListener('keydown', handleKeyDownEvent);
    };
  }, [handleKeyDownEvent]);

  function onClick(index: number, clear: boolean) {
    setIsDirty(true);
    setLevel(prevLevel => {
      if (!prevLevel) {
        return prevLevel;
      }

      // there always has to be a start position
      if (prevLevel.data.charAt(index) === LevelDataType.Start) {
        return prevLevel;
      }

      // there always has to be an end position
      if (prevLevel.data.charAt(index) === LevelDataType.End &&
        (prevLevel.data.match(new RegExp(LevelDataType.End, 'g')) || []).length === 1) {
        return prevLevel;
      }

      const level = cloneLevel(prevLevel);

      if (levelDataType === prevLevel.data.charAt(index)) {
        clear = true;
      }

      const newLevelDataType = clear ? LevelDataType.Default : levelDataType;

      // when changing start position the old position needs to be removed
      if (newLevelDataType === LevelDataType.Start) {
        const startIndex = level.data.indexOf(LevelDataType.Start);

        level.data = level.data.substring(0, startIndex) + LevelDataType.Default + level.data.substring(startIndex + 1);
      }

      level.data = level.data.substring(0, index) + newLevelDataType + level.data.substring(index + 1);

      return level;
    });
  }

  function save() {
    setIsLoading(true);
    toast.loading('Saving...');

    fetch(`/api/edit/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: level.data,
        height: level.height,
        width: level.width,
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(async res => {
      if (res.status === 200) {
        setIsDirty(false);
        mutateLevel();
        setLevel(prevLevel => {
          if (!prevLevel) {
            return prevLevel;
          }

          const level = cloneLevel(prevLevel);

          level.leastMoves = 0;

          return level;
        });
      } else {
        throw res.text();
      }
    }).catch(err => {
      console.error(err);
      toast.dismiss();
      toast.error('Error fetching level');
    }).finally(() => {
      toast.dismiss();
      toast.success('Saved');
      setIsLoading(false);
    });
  }
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const cursor = document.getElementById('cursor');

    if (!cursor) {
      return;
    }

    const { pageX, pageY } = event;

    cursor.style.left = `${pageX}px`;
    cursor.style.top = `${pageY}px`;

  }, []);

  useEffect(() => {
    removeEventListener('mousemove', handleMouseMove);
    const cursor = document.getElementById('cursor');

    if (!cursor) {
      return;
    }

    if (levelDataType === LevelDataType.Default) {

      cursor.style.display = 'none';

      return;
    } else {
      cursor.style.display = 'block';
    }

    addEventListener('mousemove', handleMouseMove);
  }, [levelDataType, handleMouseMove]);

  if (!id) {
    return null;
  }

  const listBlockChoices = [];
  const AllBlocks = LevelDataType.toString();

  for (const levelDataTypeKey in AllBlocks) {
    let txt = undefined;

    if (levelDataTypeKey === LevelDataType.End) {
      txt = level.leastMoves;
    } else if (levelDataTypeKey === LevelDataType.Start) {
      txt = 0;
    }

    listBlockChoices.push((

      <Square borderWidth={1} size={40} leastMoves={0} text={txt} levelDataType={levelDataTypeKey} key={levelDataTypeKey}
        onClick={ ()=>
        {
          setLevelDataType(levelDataTypeKey);
        }
        }/>

    ));

  }

  const blockList = <> { listBlockChoices }</>;

  return (
    <div className='flex flex-wrap'>
      <div className='z-10 m-auto md:flex md:flex-rows grid grid-cols-10'>
        {blockList}
      </div>
      <div className=''>
        <div id='cursor' style={{ pointerEvents: 'none', position: 'absolute', zIndex: 11,
          transform: 'translate(-50%, -50%)',
        }}>
          <Square borderWidth={1} size={40} leastMoves={0} levelDataType={levelDataType} />
        </div>
        <GameContainer>
          <EditorLayout
            controls={[
              new Control('btn-' + levelDataType.toLowerCase(), () => setIsLevelDataTypeOpen(true), LevelDataType.toString()[levelDataType]),
              new Control('btn-size', () => setIsSizeOpen(true), 'Size'),
              new Control('btn-data', () => setIsDataOpen(true), 'Data'),
              new Control('btn-save', () => save(), 'Save'),
              new Control('btn-test', () => router.push(`/test/${id}`), 'Test', isDirty),
              new Control('btn-publish', () => setIsPublishLevelOpen(true), 'Publish', isDirty || level.leastMoves === 0),
            ]}
            level={level}
            onClick={onClick}
          />
        </GameContainer>
        <LevelDataTypeModal
          closeModal={() => setIsLevelDataTypeOpen(false)}
          isOpen={isLevelDataTypeOpen}
          levelDataType={levelDataType}
          onChange={(e) => setLevelDataType(e.currentTarget.value)}
        />
        <SizeModal
          closeModal={() => {
            setIsSizeOpen(false);
            setIsDirty(true);
          }}
          isOpen={isSizeOpen}
          level={level}
          setLevel={setLevel}
        />
        <DataModal
          closeModal={() => {
            setIsDataOpen(false);
            setIsDirty(true);
          }}
          isOpen={isDataOpen}
          level={level}
          setLevel={setLevel}
        />
        <PublishLevelModal
          closeModal={() => setIsPublishLevelOpen(false)}
          isOpen={isPublishLevelOpen}
          level={level}
          onPublish={() => router.push('/create')}
          worlds={worlds}
        />

      </div>
    </div>);

}
